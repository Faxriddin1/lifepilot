from datetime import date, timedelta

from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import LearningGoalFilter
from .models import (
    GoalStatus,
    LearningGoal,
    LearningModule,
    LearningProgress,
    LearningTask,
    ModuleStatus,
    TaskStatus,
)
from .exceptions import TutorRateLimitError
from .models import TutorMessage
from .serializers import (
    LearningGoalCreateSerializer,
    LearningGoalDetailSerializer,
    LearningGoalSerializer,
    LearningProgressSerializer,
    LearningTaskSerializer,
    LearningTaskUpdateSerializer,
    PlanConfirmSerializer,
    PlanPreviewSerializer,
    TaskRatingSerializer,
    TutorAskSerializer,
    TutorMessageSerializer,
)
from .services import LearningService


class LearningGoalViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LearningGoalFilter

    def get_queryset(self):
        qs = (
            LearningGoal.objects.filter(user=self.request.user)
            .annotate(
                modules_count=Count("modules"),
                completed_modules_count=Count(
                    "modules",
                    filter=Q(modules__status=ModuleStatus.COMPLETED),
                ),
                total_tasks=Count("modules__tasks"),
                completed_tasks=Count(
                    "modules__tasks",
                    filter=Q(modules__tasks__status=TaskStatus.COMPLETED),
                ),
            )
        )
        if self.action == 'retrieve':
            qs = qs.prefetch_related('modules__tasks')
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return LearningGoalCreateSerializer
        if self.action == "partial_update":
            return LearningGoalCreateSerializer
        if self.action == "retrieve":
            return LearningGoalDetailSerializer
        return LearningGoalSerializer

    @action(detail=True, methods=["post"], url_path="generate-plan")
    def generate_plan(self, request, pk=None):
        goal = self.get_object()

        # Already generating — prevent duplicate tasks
        if goal.status == GoalStatus.GENERATING:
            return Response(
                {"status": "generating", "message": "Plan is already being generated. Please wait."},
                status=status.HTTP_409_CONFLICT,
            )

        if goal.status not in (GoalStatus.DRAFT, GoalStatus.PREVIEW):
            return Response(
                {"detail": "Plan can only be generated for draft or preview goals."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Switch to generating + clear old plan
        goal.status = GoalStatus.GENERATING
        goal.ai_generated_plan = None
        goal.save(update_fields=["status", "ai_generated_plan", "updated_at"])

        # Launch async Celery task
        from .tasks import generate_learning_plan_task
        generate_learning_plan_task.delay(str(goal.id), str(request.user.id))

        return Response(
            {
                "status": "generating",
                "goal_id": str(goal.id),
                "message": "Plan is being generated. Poll GET /status/ every 3-5 seconds.",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        goal = self.get_object()

        # Timeout protection: if generating > 5 minutes → reset to draft
        if goal.status == GoalStatus.GENERATING:
            elapsed = (timezone.now() - goal.updated_at).total_seconds()
            if elapsed > 300:
                goal.status = GoalStatus.DRAFT
                goal.save(update_fields=["status", "updated_at"])
                return Response({
                    "status": "draft",
                    "goal_id": str(goal.id),
                    "message": "Generation timed out. Please try again.",
                })

        response = {
            "status": goal.status,
            "goal_id": str(goal.id),
            "title": goal.title,
        }

        if goal.status == GoalStatus.PREVIEW and goal.ai_generated_plan:
            response["plan_preview"] = goal.ai_generated_plan
        elif goal.status == GoalStatus.GENERATING:
            response["message"] = "Plan is being generated, please wait..."
        elif goal.status == GoalStatus.DRAFT:
            response["message"] = "Generation not started or failed. Try again."

        return Response(response)

    @action(detail=True, methods=["post"], url_path="confirm-plan")
    def confirm_plan(self, request, pk=None):
        goal = self.get_object()

        if goal.status != GoalStatus.PREVIEW:
            return Response(
                {"detail": "Only preview goals can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PlanConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan_data = serializer.validated_data.get("plan_json") or goal.ai_generated_plan

        if not plan_data:
            return Response(
                {"detail": "No plan data available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        LearningService.create_modules_from_plan(goal, plan_data)

        goal.status = GoalStatus.ACTIVE
        goal.save(update_fields=["status", "updated_at"])

        # Re-fetch with annotations
        goal = self.get_queryset().get(pk=goal.pk)
        return Response(LearningGoalDetailSerializer(goal).data)

    @action(detail=True, methods=["get"])
    def today(self, request, pk=None):
        goal = self.get_object()
        tasks = LearningService.get_today_tasks(goal)
        return Response(LearningTaskSerializer(tasks, many=True).data)

    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        goal = self.get_object()
        thirty_days_ago = date.today() - timedelta(days=30)
        logs = LearningProgress.objects.filter(
            user=request.user,
            goal=goal,
            date__gte=thirty_days_ago,
        )
        return Response({
            "logs": LearningProgressSerializer(logs, many=True).data,
            "current_streak": goal.current_streak,
            "longest_streak": goal.longest_streak,
            "total_minutes": sum(l.minutes_spent for l in logs),
            "total_tasks_completed": sum(l.tasks_completed for l in logs),
        })

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        goal = self.get_object()
        if goal.status != GoalStatus.ACTIVE:
            return Response(
                {"detail": "Only active goals can be paused."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        goal.status = GoalStatus.PAUSED
        goal.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Goal paused."})

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        goal = self.get_object()
        if goal.status != GoalStatus.PAUSED:
            return Response(
                {"detail": "Only paused goals can be resumed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate pause duration
        paused_days = (date.today() - (goal.last_activity_date or date.today())).days
        if paused_days > 0:
            LearningService.shift_deadlines_on_resume(goal, paused_days)

        goal.status = GoalStatus.ACTIVE
        goal.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Goal resumed."})

    @action(detail=True, methods=["post"], url_path="buy-freeze")
    def buy_freeze(self, request, pk=None):
        """Add a streak freeze. Free on MVP, max 3."""
        goal = self.get_object()
        MAX_FREEZES = 3
        if goal.streak_freezes >= MAX_FREEZES:
            return Response(
                {"detail": f"Maximum {MAX_FREEZES} freezes allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        goal.streak_freezes += 1
        goal.save(update_fields=["streak_freezes", "updated_at"])
        return Response({"streak_freezes": goal.streak_freezes})

    @action(detail=True, methods=["post"])
    def adapt(self, request, pk=None):
        """User explicitly requests AI plan adaptation."""
        goal = self.get_object()
        if goal.status != GoalStatus.ACTIVE:
            return Response(
                {"detail": "Adaptation only available for active goals."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason", "User requested adaptation")
        from .tasks import run_ai_adaptation
        run_ai_adaptation.delay(str(goal.id), "explicit_request", {"user_message": reason})
        return Response(
            {"status": "adapting", "message": "AI is analyzing your progress and adapting the plan."},
            status=status.HTTP_202_ACCEPTED,
        )

    # ------------------------------------------------------------------
    # AI Tutor
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="ask")
    def ask_tutor(self, request, pk=None):
        """Ask AI tutor a question in the context of this learning goal."""
        goal = self.get_object()
        if goal.status not in (GoalStatus.ACTIVE, GoalStatus.PAUSED):
            return Response(
                {"detail": "Tutor is only available for active goals."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TutorAskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        task_id = serializer.validated_data.get("task_id")

        task = None
        if task_id:
            task = LearningTask.objects.filter(id=task_id, module__goal=goal).first()

        from .tutor_service import TutorService

        try:
            result = TutorService.ask_question(
                goal=goal, question=question, task=task, user=request.user,
            )
            return Response(result)
        except TutorRateLimitError as e:
            return Response({"detail": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception:
            return Response(
                {"detail": "AI tutor is temporarily unavailable. Try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @action(detail=True, methods=["get", "delete"], url_path="tutor-history")
    def tutor_history(self, request, pk=None):
        """GET: conversation history. DELETE: clear history."""
        goal = self.get_object()

        if request.method == "DELETE":
            count = TutorMessage.objects.filter(goal=goal).delete()[0]
            return Response({"deleted": count})

        messages = TutorMessage.objects.filter(goal=goal)
        task_id = request.query_params.get("task_id")
        if task_id:
            messages = messages.filter(task_id=task_id)

        limit = min(int(request.query_params.get("limit", 50)), 100)
        messages = list(messages.order_by("-created_at")[:limit])
        messages.reverse()

        return Response(TutorMessageSerializer(messages, many=True).data)


class LearningTaskViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Tasks are created via confirm_plan. Users can update, complete, skip, rate."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningTask.objects.filter(
            module__goal__user=self.request.user
        ).select_related("module", "module__goal")

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return LearningTaskUpdateSerializer
        return LearningTaskSerializer

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.status == TaskStatus.COMPLETED:
            return Response({"status": "already_completed"})
        task.status = TaskStatus.COMPLETED
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at"])

        LearningService.on_task_completed(task)
        return Response({"detail": "Task completed.", "streak": task.module.goal.current_streak})

    @action(detail=True, methods=["post"])
    def skip(self, request, pk=None):
        task = self.get_object()
        if task.status == TaskStatus.SKIPPED:
            return Response({"status": "already_skipped"})
        task.status = TaskStatus.SKIPPED
        task.save(update_fields=["status"])
        LearningService.on_task_skipped(task)
        return Response({"detail": "Task skipped."})

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        task = self.get_object()
        serializer = TaskRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task.user_rating = serializer.validated_data["rating"]
        task.user_notes = serializer.validated_data.get("notes", "")
        task.save(update_fields=["user_rating", "user_notes"])
        return Response({"detail": "Rating saved."})
