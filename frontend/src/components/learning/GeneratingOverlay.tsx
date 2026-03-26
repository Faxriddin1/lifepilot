import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Brain, BookOpen, Search, CheckCircle, Loader2 } from 'lucide-react';

interface GeneratingOverlayProps {
  title: string;
  /** Seconds elapsed since generation started */
  elapsedSeconds?: number;
}

interface Step {
  icon: typeof Brain;
  labelKey: string;
  durationRange: [number, number]; // [startSec, endSec]
}

const STEPS: Step[] = [
  { icon: Brain, labelKey: 'learning.generating.step1', durationRange: [0, 5] },
  { icon: BookOpen, labelKey: 'learning.generating.step2', durationRange: [5, 15] },
  { icon: Search, labelKey: 'learning.generating.step3', durationRange: [15, 25] },
  { icon: CheckCircle, labelKey: 'learning.generating.step4', durationRange: [25, 35] },
];

/**
 * Generating overlay with step-by-step progress indicator.
 * Shows realistic stages of plan generation with a smooth progress bar.
 */
export function GeneratingOverlay({ title, elapsedSeconds: externalElapsed }: GeneratingOverlayProps) {
  const { t } = useTranslation();
  const [internalElapsed, setInternalElapsed] = useState(0);

  // Internal timer as fallback if elapsedSeconds not provided
  useEffect(() => {
    if (externalElapsed !== undefined) return;
    const interval = setInterval(() => {
      setInternalElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [externalElapsed]);

  const elapsed = externalElapsed ?? internalElapsed;

  // Calculate progress (0-95%, never 100% until actually done)
  const progress = Math.min(95, elapsed <= 5
    ? elapsed * 4                    // 0-20% in first 5s
    : elapsed <= 15
      ? 20 + (elapsed - 5) * 3      // 20-50% in 5-15s
      : elapsed <= 25
        ? 50 + (elapsed - 15) * 2.5 // 50-75% in 15-25s
        : 75 + (elapsed - 25) * 0.8 // 75-95% slow crawl after 25s
  );

  // Determine current step
  const currentStepIndex = STEPS.findIndex(
    step => elapsed >= step.durationRange[0] && elapsed < step.durationRange[1]
  );
  const activeStep = currentStepIndex === -1 ? STEPS.length - 1 : currentStepIndex;

  return (
    <div className="flex flex-col gap-6 py-6 max-w-lg mx-auto">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-foreground-secondary">{t('learning.generating.subtitle')}</p>
      </div>

      {/* Progress bar with percentage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-foreground-secondary">
            {t('learning.generating.progress')}
          </span>
          <span className="text-xs font-mono font-semibold text-accent">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isPending = index > activeStep;

          return (
            <div
              key={index}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-500',
                isActive && 'border-accent/30 bg-accent/5',
                isCompleted && 'border-success/20 bg-success-bg',
                isPending && 'border-border bg-surface opacity-50',
              )}
            >
              {/* Icon */}
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isActive && 'bg-accent/10 text-accent',
                isCompleted && 'bg-success-bg text-success',
                isPending && 'bg-surface text-foreground-tertiary',
              )}>
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              {/* Label */}
              <span className={clsx(
                'text-sm',
                isActive && 'text-foreground font-medium',
                isCompleted && 'text-success',
                isPending && 'text-foreground-tertiary',
              )}>
                {t(step.labelKey)}
              </span>

              {/* Time indicator for active step */}
              {isActive && (
                <span className="ml-auto text-xs text-foreground-tertiary tabular-nums">
                  {elapsed}с
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Skeleton preview of plan structure */}
      <div className="space-y-2 mt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-surface flex items-center gap-3">
              <div className="animate-pulse rounded-full bg-foreground/10 w-4 h-4 flex-shrink-0" />
              <div className={clsx(
                'animate-pulse rounded bg-foreground/10 h-4',
                i === 1 ? 'w-3/5' : i === 2 ? 'w-2/3' : 'w-3/4'
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
