import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Save,
  Smile,
  Meh,
  Frown,
  Zap,
  Star,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { productivityApi } from '@/api/productivity';
import { showApiError, showSuccess } from '@/utils/errorHandler';
import type { DailyLogMood } from '@/types';

const MOOD_OPTIONS: { value: DailyLogMood; icon: typeof Smile; labelKey: string; color: string }[] = [
  { value: 'great', icon: Star, labelKey: 'dailyLog.moodGreat', color: 'var(--color-success)' },
  { value: 'good', icon: Smile, labelKey: 'dailyLog.moodGood', color: 'var(--accent-primary)' },
  { value: 'okay', icon: Meh, labelKey: 'dailyLog.moodOkay', color: 'var(--color-warning)' },
  { value: 'bad', icon: Frown, labelKey: 'dailyLog.moodBad', color: 'var(--color-danger)' },
  { value: 'terrible', icon: Frown, labelKey: 'dailyLog.moodTerrible', color: 'var(--accent-brand)' },
];

/** Форматирует Date в строку YYYY-MM-DD. */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Страница дневника — ежедневные записи с итогами, планами, заметками и настроением. */
export function DailyLogPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = toDateStr(currentDate);

  const [done, setDone] = useState('');
  const [planned, setPlanned] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<DailyLogMood | ''>('');
  const [energy, setEnergy] = useState(0);
  const [existingId, setExistingId] = useState<string | null>(null);

  // Load all logs for history sidebar
  const { data: logsData } = useQuery({
    queryKey: ['daily-logs'],
    queryFn: productivityApi.getDailyLogs,
    staleTime: 30_000,
  });

  // Load specific date
  const { data: dayLog, isLoading } = useQuery({
    queryKey: ['daily-log', dateStr],
    queryFn: async () => {
      const logs = await productivityApi.getDailyLogs();
      return logs.results.find((l) => l.date === dateStr) || null;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (dayLog) {
      setDone(dayLog.done || '');
      setPlanned(dayLog.planned || '');
      setNotes(dayLog.notes || '');
      setMood(dayLog.mood || '');
      setEnergy(dayLog.energy_level || 0);
      setExistingId(dayLog.id || null);
    } else {
      setDone('');
      setPlanned('');
      setNotes('');
      setMood('');
      setEnergy(0);
      setExistingId(null);
    }
  }, [dayLog]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { date: dateStr, done, planned, notes, mood, energy_level: energy };
      if (existingId) {
        return productivityApi.updateDailyLog(existingId, payload);
      }
      return productivityApi.createDailyLog(payload);
    },
    onSuccess: (saved) => {
      setExistingId(saved.id || null);
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-log', dateStr] });
      showSuccess(t('dailyLog.entrySaved'));
    },
    onError: (err) => showApiError(err),
  });

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;

  const formattedDate = currentDate.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz-cyr' ? 'uz-Cyrl' : i18n.language === 'uz' ? 'uz-Latn' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Group past logs by month for sidebar
  const pastLogs = (logsData?.results ?? []).filter((l) => l.date !== dateStr);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <button onClick={prevDay} className="p-1.5 sm:p-2 rounded-lg hover:bg-surface transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-foreground capitalize text-center truncate">
            {formattedDate}
          </h2>
          <button onClick={nextDay} className="p-1.5 sm:p-2 rounded-lg hover:bg-surface transition-colors flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <div className="flex gap-2">
          {!isToday && (
            <Button variant="secondary" size="sm" onClick={goToday}>
              {t('dailyLog.today')}
            </Button>
          )}
          <Button
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            {t('dailyLog.save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Done */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-success" />
              <h3 className="font-semibold text-foreground">
                {t('dailyLog.whatWasDone')}
              </h3>
            </div>
            <textarea
              value={done}
              onChange={(e) => setDone(e.target.value)}
              placeholder={t('dailyLog.whatWasDonePlaceholder')}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground-tertiary resize-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-all text-sm"
            />
          </Card>

          {/* Planned */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <h3 className="font-semibold text-foreground">
                {t('dailyLog.plansForTomorrow')}
              </h3>
            </div>
            <textarea
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              placeholder={t('dailyLog.plansPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground-tertiary resize-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-all text-sm"
            />
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-brand" />
              <h3 className="font-semibold text-foreground">
                {t('dailyLog.notes')}
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('dailyLog.notesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground-tertiary resize-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-all text-sm"
            />
          </Card>
        </div>

        {/* Sidebar — mood, energy, history */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
          {/* Mood */}
          <Card>
            <h3 className="font-semibold text-foreground mb-3">
              {t('dailyLog.mood')}
            </h3>
            <div className="grid grid-cols-5 gap-1">
              {MOOD_OPTIONS.map((m) => {
                const Icon = m.icon;
                const isSelected = mood === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMood(isSelected ? '' : m.value)}
                    className={clsx(
                      'flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all',
                      isSelected
                        ? 'ring-2 shadow-sm scale-105'
                        : 'hover:bg-surface opacity-60 hover:opacity-100',
                    )}
                    style={isSelected ? { backgroundColor: `${m.color}15`, color: m.color, outlineColor: m.color } : {}}
                    title={t(m.labelKey)}
                  >
                    <Icon className="w-5 h-5" style={isSelected ? { color: m.color } : {}} />
                    <span className={clsx('text-[10px] leading-tight font-medium truncate w-full text-center', !isSelected && 'text-foreground-secondary')}>
                      {t(m.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Energy */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-foreground">
                {t('dailyLog.energy')}
              </h3>
              <span className="ml-auto text-sm font-bold text-warning">{energy}/5</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(energy === level ? 0 : level)}
                  className={clsx(
                    'flex-1 h-8 rounded-md transition-all',
                    level <= energy
                      ? 'bg-warning'
                      : 'bg-elevated hover:bg-border',
                  )}
                />
              ))}
            </div>
          </Card>

          {/* History */}
          <Card>
            <h3 className="font-semibold text-foreground mb-3">
              {t('dailyLog.recentEntries')}
            </h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {pastLogs.length === 0 ? (
                <p className="text-sm text-foreground-tertiary text-center py-3">
                  {t('dailyLog.noEntries')}
                </p>
              ) : (
                pastLogs.slice(0, 15).map((log) => {
                  const moodInfo = MOOD_OPTIONS.find((m) => m.value === log.mood);
                  return (
                    <button
                      key={log.id}
                      onClick={() => {
                        const [y, m, d] = log.date.split('-').map(Number);
                        setCurrentDate(new Date(y, m - 1, d));
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors text-sm',
                        log.date === dateStr
                          ? 'bg-accent/10'
                          : 'hover:bg-surface',
                      )}
                    >
                      <span className="text-foreground font-medium">
                        {new Date(log.date + 'T00:00:00').toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz-cyr' ? 'uz-Cyrl' : i18n.language === 'uz' ? 'uz-Latn' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {moodInfo && (
                          <span style={{ color: moodInfo.color }}>
                            {(() => { const I = moodInfo.icon; return <I className="w-3.5 h-3.5" />; })()}
                          </span>
                        )}
                        {log.energy_level > 0 && (
                          <span className="text-xs text-warning font-medium">⚡{log.energy_level}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
