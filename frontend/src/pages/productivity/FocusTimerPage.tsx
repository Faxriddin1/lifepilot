import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, Clock, Zap, Coffee, Volume2 } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useFocusSession, useFocusHistory } from '@/hooks/useFocus';
import { useTasksQuery } from '@/hooks/useTasks';
import { useGoals, useGoal } from '@/hooks/useLearning';
import { formatSeconds, formatDuration, formatDate } from '@/utils/formatters';
import { SessionType } from '@/types';
import { getSessionPresets } from '@/utils/constants';
import { useTranslation } from 'react-i18next';
import { GraduationCap } from 'lucide-react';

/** Страница таймера фокусировки с круговым прогрессом, пресетами и историей сессий. */
export function FocusTimerPage() {
  const {
    isActive,
    isPaused,
    remainingSeconds,
    progress,
    start,
    stop,
    pause,
    resume,
    isStarting,
  } = useFocusSession();

  const { data: historyData, isLoading: historyLoading } = useFocusHistory();
  const { data: tasksData } = useTasksQuery({ status: undefined, page_size: 50 });
  const { data: goalsData } = useGoals();

  // Get active goal ID for fetching detail with modules/tasks
  const activeGoalId = (() => {
    const goals = goalsData?.results ?? goalsData ?? [];
    const arr = Array.isArray(goals) ? goals : [];
    const active = arr.find((g: any) => g.status === 'active');
    return active?.id || '';
  })();
  const { data: activeGoalDetail } = useGoal(activeGoalId);

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [autoBreakMode, setAutoBreakMode] = useState(false); // true = currently in auto-break
  const [showFocusPrompt, setShowFocusPrompt] = useState(false); // show "start next focus?" banner
  const autoCompleteRef = useRef(false);
  const { t } = useTranslation();

  const presets = getSessionPresets();
  const preset = presets[selectedPreset];
  const timerMinutes = preset.minutes;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send browser notification
  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }
    // Also play sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdW2MkZCBdHB8fYmRjYR4cHZ5hI2OiYB0cXd8hoyNiYF0cXh8');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (!isActive || isPaused) return;
    if (remainingSeconds > 0) {
      autoCompleteRef.current = false;
      return;
    }
    if (autoCompleteRef.current) return; // prevent double-fire
    autoCompleteRef.current = true;

    const isBreak = preset.type === 'short_break' || preset.type === 'long_break';

    if (isBreak) {
      // Break finished → stop + prompt for new focus
      stop();
      setAutoBreakMode(false);
      setShowFocusPrompt(true);
      sendNotification(
        t('focusTimer.breakDone'),
        t('focusTimer.readyForFocus')
      );
    } else {
      // Focus finished → auto-stop + start break
      stop();
      setPomodoroCount(prev => prev + 1);
      sendNotification(
        t('focusTimer.focusDone'),
        t('focusTimer.breakStarting')
      );

      // Auto-start break after 1.5 seconds
      setTimeout(() => {
        const newCount = pomodoroCount + 1;
        // Every 4th pomodoro → long break, otherwise short break
        const breakPresetIndex = newCount % 4 === 0 ? 3 : 2; // 3=long break, 2=short break
        const breakPreset = presets[breakPresetIndex];

        setSelectedPreset(breakPresetIndex);
        setAutoBreakMode(true);
        setShowFocusPrompt(false);

        start({
          session_type: breakPreset.type as SessionType,
          duration: breakPreset.minutes,
          start_time: new Date().toISOString(),
          task: null,
        });
      }, 1500);
    }
  }, [isActive, isPaused, remainingSeconds, preset.type]);

  const handleStart = () => {
    setShowFocusPrompt(false);
    setAutoBreakMode(false);
    start({
      session_type: preset.type as SessionType,
      duration: timerMinutes,
      start_time: new Date().toISOString(),
      task: selectedTaskId || null,
    });
  };

  const handleStartNextFocus = () => {
    setShowFocusPrompt(false);
    setAutoBreakMode(false);
    // Return to pomodoro preset
    setSelectedPreset(0);
    const focusPreset = presets[0];
    start({
      session_type: focusPreset.type as SessionType,
      duration: focusPreset.minutes,
      start_time: new Date().toISOString(),
      task: selectedTaskId || null,
    });
  };

  // SVG circle math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const totalFocusToday = (historyData?.results ?? [])
    .filter((s) => {
      const today = new Date().toISOString().split('T')[0];
      return s.start_time?.startsWith(today);
    })
    .reduce((sum, s) => sum + (s.duration ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card className="text-center">
            {/* Mode selector */}
            <div className="flex justify-center gap-2 mb-8">
              {getSessionPresets().map((p, i) => (
                <button
                  key={i}
                  onClick={() => !isActive && setSelectedPreset(i)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedPreset === i
                      ? 'bg-accent/10 text-accent'
                      : 'text-foreground-secondary hover:bg-surface'
                  )}
                  disabled={isActive}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Circle timer */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg width="280" height="280" className="-rotate-90">
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-elevated"
                />
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={isActive ? dashOffset : circumference}
                  className="text-accent transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono text-foreground tracking-wider">
                  {isActive ? formatSeconds(remainingSeconds) : formatSeconds(timerMinutes * 60)}
                </span>
                <span className="text-sm text-foreground-secondary mt-2">
                  {isActive
                    ? isPaused
                      ? t('focusTimer.paused')
                      : autoBreakMode
                        ? '☕ ' + t('focusTimer.onBreak')
                        : t('focusTimer.focusing')
                    : showFocusPrompt
                      ? t('focusTimer.breakDone')
                      : t('focusTimer.ready')}
                </span>
                {/* Pomodoro counter */}
                {pomodoroCount > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(Math.min(pomodoroCount, 4))].map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent" />
                    ))}
                    {[...Array(Math.max(0, 4 - pomodoroCount % 4))].map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-elevated" />
                    ))}
                    <span className="text-xs text-foreground-tertiary ml-1">
                      {pomodoroCount}/4
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* "Start next focus?" prompt after break */}
            {showFocusPrompt && !isActive && (
              <div className="mb-6 p-4 rounded-lg border border-accent/30 bg-accent/5 text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  ☕ {t('focusTimer.breakDone')}
                </p>
                <p className="text-xs text-foreground-secondary mb-3">
                  {t('focusTimer.readyForFocus')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="md"
                    icon={<Play className="w-4 h-4" />}
                    onClick={handleStartNextFocus}
                  >
                    {t('focusTimer.startFocus')}
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => setShowFocusPrompt(false)}
                  >
                    {t('focusTimer.endSession')}
                  </Button>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {!isActive && !showFocusPrompt ? (
                <Button
                  size="lg"
                  icon={<Play className="w-5 h-5" />}
                  onClick={handleStart}
                  loading={isStarting}
                  className="px-8"
                >
                  {t('focusTimer.startFocus')}
                </Button>
              ) : (
                <>
                  {isPaused ? (
                    <Button
                      size="lg"
                      icon={<Play className="w-5 h-5" />}
                      onClick={resume}
                    >
                      {t('focusTimer.resume')}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      icon={<Pause className="w-5 h-5" />}
                      onClick={pause}
                    >
                      {t('focusTimer.pause')}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="danger"
                    icon={<Square className="w-5 h-5" />}
                    onClick={stop}
                  >
                    {t('focusTimer.stop')}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    icon={<SkipForward className="w-5 h-5" />}
                    onClick={stop}
                  >
                    {t('focusTimer.skip')}
                  </Button>
                </>
              )}
            </div>

            {/* Task selector — regular tasks + learning tasks */}
            {!isActive && (
              <div className="max-w-sm mx-auto">
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="block w-full h-9 rounded-md border border-border bg-background px-3 py-1 pr-10 text-sm text-foreground appearance-none transition-colors duration-normal shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
                >
                  <option value="">{t('focusTimer.linkTask')}</option>
                  <option value="" disabled>── {t('focusTimer.noTask')} ──</option>

                  {/* Regular tasks (only open — not done/archived) */}
                  {(() => {
                    const openTasks = (tasksData?.results ?? []).filter(
                      (task) => task.status !== 'done' && task.status !== 'archived'
                    );
                    if (openTasks.length === 0) return null;
                    return (
                      <optgroup label={`📋 ${t('sidebar.myTasks')}`}>
                        {openTasks.map((task) => (
                          <option key={task.id} value={String(task.id)}>
                            {task.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })()}

                  {/* Learning tasks from active goal */}
                  {activeGoalDetail && activeGoalDetail.modules && (() => {
                    const goal = activeGoalDetail;
                    const availableModules = (goal.modules ?? []).filter(
                      (m: any) => m.status === 'available' || m.status === 'in_progress'
                    );
                    const learningTasks = availableModules.flatMap((m: any) =>
                      (m.tasks ?? []).filter((lt: any) => lt.status === 'todo' || lt.status === 'in_progress')
                    );
                    if (learningTasks.length === 0) return null;

                    return (
                      <optgroup label={`🎓 ${goal.title}`}>
                        {learningTasks.map((lt: any) => (
                          <option key={lt.id} value={`learning:${lt.id}`}>
                            {lt.title} ({lt.estimated_minutes} {t('learning.today.minutes')})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })()}
                </select>
              </div>
            )}
          </Card>
        </div>

        {/* Stats + Sessions */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-info-bg flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">{t('focusTimer.todaysFocus')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(totalFocusToday)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('focusTimer.sessionLog')} subtitle={t('focusTimer.today')} />
            {historyLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(historyData?.results ?? []).slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-surface"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-foreground-tertiary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {session.task_title || t('focusTimer.freeFocus')}
                        </p>
                        <p className="text-xs text-foreground-tertiary">
                          {formatDate(session.start_time, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">
                      {formatDuration(session.duration ?? 0)}
                    </Badge>
                  </div>
                ))}
                {(!historyData?.results || historyData.results.length === 0) && (
                  <p className="text-sm text-foreground-tertiary text-center py-4">
                    {t('focusTimer.noSessions')}
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
