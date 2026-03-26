import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Loader2, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTutorHistory, useAskTutor, useClearTutorHistory } from '@/hooks/useLearning';

interface TutorChatProps {
  /** UUID цели обучения */
  goalId: string;
  /** UUID задачи для контекстной фильтрации истории (опционально) */
  taskId?: string;
  /** Заголовок текущей задачи для отображения в шапке (опционально) */
  taskTitle?: string;
  /** Заголовок текущего модуля для отображения в шапке (опционально) */
  moduleTitle?: string;
  /** Управляет видимостью панели */
  isOpen: boolean;
  /** Callback для закрытия панели */
  onClose: () => void;
}

/**
 * Side-panel чат с AI Tutor.
 * Поддерживает историю сообщений, отправку по Enter, Shift+Enter для переноса строки,
 * обработку ошибок 429/503, анимацию открытия/закрытия через AnimatePresence.
 */
export function TutorChat({ goalId, taskId, taskTitle, moduleTitle, isOpen, onClose }: TutorChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: history = [], isLoading: historyLoading } = useTutorHistory(goalId, taskId);
  const askMutation = useAskTutor(goalId);
  const clearMutation = useClearTutorHistory(goalId);

  const isResponding = askMutation.isPending;

  // Scroll to bottom whenever history changes or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen, isResponding]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = () => {
    const question = input.trim();
    if (!question || isResponding) return;

    setInput('');

    askMutation.mutate(
      { question, task_id: taskId },
      {
        onError: (error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status === 429) {
            toast.error(t('tutor.rateLimited'));
          } else if (status === 503) {
            toast.error(t('tutor.unavailable'));
          } else {
            toast.error(t('errors.generic', 'Something went wrong.'));
          }
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => toast.success(t('tutor.clearHistory')),
      onError: () => toast.error(t('errors.generic', 'Something went wrong.')),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            key="tutor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-[var(--bg-overlay)] lg:hidden"
            onClick={onClose}
          />

          {/* Chat panel */}
          <motion.aside
            key="tutor-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={[
              'fixed right-0 top-0 z-40 flex flex-col',
              'h-full w-full lg:w-[400px]',
              'bg-background border-l border-border shadow-lg',
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="w-5 h-5 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-foreground block truncate">{t('tutor.title')}</span>
                  {(taskTitle || moduleTitle) && (
                    <span className="text-xs text-foreground-secondary truncate block">
                      {taskTitle ?? moduleTitle}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={handleClear}
                    disabled={clearMutation.isPending}
                    title={t('tutor.clearHistory')}
                    className="p-1.5 rounded-md text-foreground-secondary hover:text-danger hover:bg-surface transition-colors duration-fast disabled:opacity-50"
                  >
                    {clearMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-foreground-secondary hover:text-foreground hover:bg-surface transition-colors duration-fast"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {historyLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-foreground-secondary" />
                </div>
              )}

              {!historyLoading && history.length === 0 && !isResponding && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <GraduationCap className="w-10 h-10 text-foreground-secondary opacity-40" />
                  <p className="text-sm text-foreground-secondary">{t('tutor.needHelp')}</p>
                </div>
              )}

              {history.map(
                (msg: {
                  id: string;
                  role: 'user' | 'assistant';
                  content: string;
                  topic?: string;
                  module_title?: string;
                  created_at: string;
                }) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-start gap-2 mr-8 max-w-full">
                        <span className="mt-1 text-base shrink-0" aria-hidden="true">
                          🎓
                        </span>
                        <div className="bg-surface rounded-lg p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words min-w-0">
                          {msg.content}
                          {msg.topic && (
                            <p className="mt-1.5 text-xs text-foreground-secondary opacity-70">
                              {msg.topic}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="bg-accent/10 rounded-lg p-3 ml-8 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words max-w-full">
                        {msg.content}
                      </div>
                    )}
                  </motion.div>
                )
              )}

              {/* Thinking indicator */}
              {isResponding && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2 mr-8">
                    <span className="mt-1 text-base shrink-0" aria-hidden="true">
                      🎓
                    </span>
                    <div className="bg-surface rounded-lg px-4 py-3 flex items-center gap-1.5">
                      <span className="text-xs text-foreground-secondary mr-1">
                        {t('tutor.thinking')}
                      </span>
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-foreground-secondary inline-block"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 px-4 py-3 border-t border-border">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isResponding}
                  placeholder={t('tutor.placeholder')}
                  rows={1}
                  className={[
                    'flex-1 resize-none border border-border rounded-lg p-3',
                    'bg-background text-foreground placeholder:text-foreground-secondary',
                    'text-sm leading-relaxed outline-none',
                    'focus:border-accent focus:ring-1 focus:ring-accent/30',
                    'transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed',
                    'max-h-32 overflow-y-auto',
                  ].join(' ')}
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
                <button
                  onClick={handleSend}
                  disabled={isResponding || !input.trim()}
                  className={[
                    'shrink-0 p-3 rounded-lg',
                    'bg-accent text-[var(--text-on-accent,#fff)]',
                    'hover:opacity-90 active:scale-[0.97]',
                    'transition-all duration-fast',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
                  ].join(' ')}
                >
                  {isResponding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
