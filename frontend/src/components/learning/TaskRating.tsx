import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskRatingProps {
  taskId: string;
  currentRating: number | null;
  onRate: (rating: number, notes?: string) => void;
}

/**
 * 5-star rating widget with optional textarea for notes.
 */
export function TaskRating({ taskId: _taskId, currentRating, onRate }: TaskRatingProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(currentRating ?? 0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const active = hovered || selected;

  const handleStarClick = (value: number) => {
    setSelected(value);
    setShowNotes(true);
  };

  const handleSubmit = () => {
    if (selected > 0) {
      onRate(selected, notes.trim() || undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleStarClick(n)}
            className="p-0.5 transition-transform duration-fast hover:scale-110 focus-visible:outline-none"
            aria-label={t('learning.rating.starLabel', { n })}
          >
            <Star
              className={clsx(
                'w-5 h-5 transition-colors duration-fast',
                n <= active ? 'text-warning fill-warning' : 'text-foreground-secondary'
              )}
            />
          </button>
        ))}
        {selected > 0 && (
          <span className="ml-2 text-sm text-foreground-secondary">
            {selected}/5
          </span>
        )}
      </div>

      {/* Notes */}
      {showNotes && (
        <div className="flex flex-col gap-2">
          <textarea
            rows={2}
            placeholder={t('learning.rating.notesPlaceholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={selected === 0}>
              {t('learning.rating.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
