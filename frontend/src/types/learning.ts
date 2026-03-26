// Learning Types

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type GoalStatus = 'draft' | 'generating' | 'preview' | 'active' | 'paused' | 'completed' | 'abandoned';
export type LearningModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type LearningTaskType = 'video' | 'article' | 'practice' | 'quiz' | 'project';
export type LearningTaskStatus = 'todo' | 'in_progress' | 'completed' | 'skipped';

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  difficulty_level: DifficultyLevel;
  target_date: string;
  minutes_per_day: number;
  days_per_week: number;
  status: GoalStatus;
  ai_generated_plan: any | null;
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
  last_activity_date: string | null;
  modules_count: number;
  completed_modules_count: number;
  total_tasks: number;
  completed_tasks: number;
  progress_percent: number;
  today_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface LearningGoalDetail extends LearningGoal {
  modules: LearningModule[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  order: number;
  status: LearningModuleStatus;
  deadline: string | null;
  tasks: LearningTask[];
  completed_tasks_count: number;
  total_tasks_count: number;
  progress_percent: number;
}

export interface LearningTask {
  id: string;
  title: string;
  description: string;
  task_type: LearningTaskType;
  resource_url: string;
  resource_query: string;
  estimated_minutes: number;
  order: number;
  status: LearningTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  user_rating: number | null;
  user_notes: string;
}

export interface LearningProgress {
  id: string;
  date: string;
  tasks_completed: number;
  minutes_spent: number;
  streak_day: number;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  module_title: string;
  topic: string;
  task: string | null;
  created_at: string;
}

export interface TutorAskResponse {
  answer: string;
  message_id: string;
  topic: string;
  module: string;
}

export interface GoalStatusResponse {
  status: GoalStatus;
  goal_id: string;
  title: string;
  plan_preview?: any;
  message?: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  target_date: string;
  minutes_per_day: number;
  days_per_week?: number;
}
