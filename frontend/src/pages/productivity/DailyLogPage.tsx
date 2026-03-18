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

const MOOD_OPTIONS: { value: DailyLogMood; icon: typeof Smile; label_en: string; label_ru: string; color: string }[] = [
  { value: 'great', icon: Star, label_en: 'Great', label_ru: 'Отлично', color: '#22C55E' },
  { value: 'good', icon: Smile, label_en: 'Good', label_ru: 'Хорошо', color: '#3B82F6' },
  { value: 'okay', icon: Meh, label_en: 'Okay', label_ru: 'Нормально', color: '#F59E0B' },
  { value: 'bad', icon: Frown, label_en: 'Bad', label_ru: 'Плохо', color: '#EF4444' },
  { value: 'terrible', icon: Frown, label_en: 'Terrible', label_ru: 'Ужасно', color: '#7C3AED' },
];

/** Форматирует Date в строку YYYY-MM-DD. */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Страница дневника — ежедневные записи с итогами, планами, заметками и настроением. */
export function DailyLogPage() {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
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
      showSuccess(isRu ? 'Запись сохранена' : 'Entry saved');
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

  const formattedDate = currentDate.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
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
          <button onClick={prevDay} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 capitalize text-center truncate">
            {formattedDate}
          </h2>
          <button onClick={nextDay} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex gap-2">
          {!isToday && (
            <Button variant="secondary" size="sm" onClick={goToday}>
              {isRu ? 'Сегодня' : 'Today'}
            </Button>
          )}
          <Button
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Done */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {isRu ? 'Что сделано' : 'What was done'}
              </h3>
            </div>
            <textarea
              value={done}
              onChange={(e) => setDone(e.target.value)}
              placeholder={isRu ? 'Перечислите основные достижения дня...' : 'List your main achievements today...'}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </Card>

          {/* Planned */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {isRu ? 'Планы на завтра' : 'Plans for tomorrow'}
              </h3>
            </div>
            <textarea
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              placeholder={isRu ? 'Что планируете сделать завтра...' : 'What do you plan to do tomorrow...'}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {isRu ? 'Заметки' : 'Notes'}
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRu ? 'Свободные мысли, идеи, рефлексия...' : 'Free thoughts, ideas, reflections...'}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </Card>
        </div>

        {/* Sidebar — mood, energy, history */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
          {/* Mood */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {isRu ? 'Настроение' : 'Mood'}
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
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 hover:opacity-100',
                    )}
                    style={isSelected ? { backgroundColor: `${m.color}15`, color: m.color, outlineColor: m.color } : {}}
                    title={isRu ? m.label_ru : m.label_en}
                  >
                    <Icon className="w-5 h-5" style={isSelected ? { color: m.color } : {}} />
                    <span className={clsx('text-[10px] leading-tight font-medium truncate w-full text-center', !isSelected && 'text-gray-500')}>
                      {isRu ? m.label_ru : m.label_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Energy */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {isRu ? 'Энергия' : 'Energy'}
              </h3>
              <span className="ml-auto text-sm font-bold text-amber-500">{energy}/5</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(energy === level ? 0 : level)}
                  className={clsx(
                    'flex-1 h-8 rounded-md transition-all',
                    level <= energy
                      ? 'bg-amber-400 dark:bg-amber-500'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600',
                  )}
                />
              ))}
            </div>
          </Card>

          {/* History */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {isRu ? 'Последние записи' : 'Recent entries'}
            </h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {pastLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  {isRu ? 'Пока нет записей' : 'No entries yet'}
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
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                      )}
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(log.date + 'T00:00:00').toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
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
                          <span className="text-xs text-amber-500 font-medium">⚡{log.energy_level}</span>
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
