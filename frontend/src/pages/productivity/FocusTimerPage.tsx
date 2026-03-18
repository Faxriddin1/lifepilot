import { useState } from 'react';
import { Play, Pause, Square, SkipForward, Clock, Zap } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useFocusSession, useFocusHistory } from '@/hooks/useFocus';
import { useTasksQuery } from '@/hooks/useTasks';
import { formatSeconds, formatDuration, formatDate } from '@/utils/formatters';
import { SessionType } from '@/types';
import { getSessionPresets } from '@/utils/constants';
import { useTranslation } from 'react-i18next';

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

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const { t } = useTranslation();

  const preset = getSessionPresets()[selectedPreset];
  const timerMinutes = preset.minutes;

  const handleStart = () => {
    start({
      session_type: preset.type as SessionType,
      duration: timerMinutes,
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
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  className="text-gray-200 dark:text-gray-800"
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
                  className="text-primary-600 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono text-gray-900 dark:text-gray-100 tracking-wider">
                  {isActive ? formatSeconds(remainingSeconds) : formatSeconds(timerMinutes * 60)}
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  {isActive
                    ? isPaused
                      ? t('focusTimer.paused')
                      : t('focusTimer.focusing')
                    : t('focusTimer.ready')}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {!isActive ? (
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

            {/* Task selector */}
            {!isActive && (
              <div className="max-w-xs mx-auto">
                <Select
                  placeholder={t('focusTimer.linkTask')}
                  options={[
                    { value: '', label: t('focusTimer.noTask') },
                    ...(tasksData?.results ?? []).map((t) => ({
                      value: String(t.id),
                      label: t.title,
                    })),
                  ]}
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Stats + Sessions */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('focusTimer.todaysFocus')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {session.task_title || t('focusTimer.freeFocus')}
                        </p>
                        <p className="text-xs text-gray-400">
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
                  <p className="text-sm text-gray-400 text-center py-4">
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
