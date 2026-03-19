import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Search, Calendar, Clock, FileText, Tag, Wallet, Repeat,
  Utensils, ShoppingBag, Car, Home, Heart, Gamepad2,
  Plane, Zap, GraduationCap, Gift, Shield, Sparkles,
  CircleDot, Briefcase, Laptop, TrendingUp, Banknote,
  Building, RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateTransaction, useCreateAccount, useAccounts, useCategories } from '@/hooks/useFinance';
import { TransactionType, type CreateTransactionData, type Category } from '@/types';
import { validateTransactionForm } from '@/utils/validation';

/** Маппинг иконок категорий на Lucide компоненты. */
const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'car': Car,
  'home': Home,
  'heart-pulse': Heart,
  'gamepad-2': Gamepad2,
  'plane': Plane,
  'zap': Zap,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'shield': Shield,
  'sparkles': Sparkles,
  'circle-dot': CircleDot,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'banknote': Banknote,
  'building': Building,
  'rotate-ccw': RotateCcw,
  'repeat': Repeat,
};

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
}

/** Модальное окно создания транзакции с визуальным выбором категории. */
export function AddTransactionModal({ isOpen, onClose, defaultType }: AddTransactionModalProps) {
  const { t } = useTranslation();
  const createTransaction = useCreateTransaction();
  const createAccount = useCreateAccount();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState((accounts ?? [])[0]?.id?.toString() || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [catSearch, setCatSearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const filteredCategories = useMemo(() => {
    let cats = (categories ?? []).filter(
      (c) =>
        (type === TransactionType.INCOME && (c.category_type || c.type) === 'income') ||
        (type === TransactionType.EXPENSE && (c.category_type || c.type) === 'expense') ||
        type === TransactionType.TRANSFER
    );
    if (catSearch) {
      cats = cats.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()));
    }
    return cats;
  }, [categories, type, catSearch]);

  const selectedCategory = (categories ?? []).find((c) => String(c.id) === categoryId);

  const typeConfig = {
    [TransactionType.EXPENSE]: {
      icon: ArrowDownLeft,
      label: t('transactionsPage.expense'),
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      ring: 'ring-red-500',
    },
    [TransactionType.INCOME]: {
      icon: ArrowUpRight,
      label: t('transactionsPage.income'),
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      ring: 'ring-green-500',
    },
    [TransactionType.TRANSFER]: {
      icon: ArrowLeftRight,
      label: t('transactionsPage.transfer'),
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      ring: 'ring-blue-500',
    },
  };

  const handleSubmit = () => {
    const validationErrors = validateTransactionForm(amount, description, accountId);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const data: CreateTransactionData = {
      transaction_type: type,
      amount: parseFloat(amount),
      note: description.trim() + (notes ? `\n${notes}` : ''),
      category: categoryId || null,
      account: accountId,
      date,
      is_recurring: isRecurring,
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        onClose();
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setNotes('');
    setIsRecurring(false);
    setCatSearch('');
    setShowAllCategories(false);
    setErrors({});
  };

  const getCategoryIcon = (iconName: string) => {
    return CATEGORY_ICONS[iconName] || Tag;
  };

  if (!isOpen) return null;

  const currentType = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('transactionsPage.addTransaction')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Type selector — large buttons */}
          <div className="grid grid-cols-3 gap-2">
            {([TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER] as const).map((t) => {
              const cfg = typeConfig[t];
              const Icon = cfg.icon;
              const isActive = type === t;
              return (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategoryId(''); }}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200',
                    isActive
                      ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm scale-[1.02]`
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 hover:text-gray-600',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Amount — big input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t('transactionsPage.amount')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className={clsx(
                  'w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border-2 bg-gray-50 dark:bg-gray-800 transition-colors',
                  'focus:outline-none focus:ring-2',
                  errors.amount
                    ? 'border-red-300 focus:ring-red-500 text-red-600'
                    : `border-gray-200 dark:border-gray-700 focus:${currentType.ring} text-gray-900 dark:text-gray-100`,
                )}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>

          {/* Category — visual grid */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('transactionsPage.category')}
            </label>

            {/* Selected category chip */}
            {selectedCategory && !showAllCategories && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors w-full text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedCategory.color}20` }}
                >
                  {(() => {
                    const Icon = getCategoryIcon(selectedCategory.icon || '');
                    return <Icon className="w-4 h-4" style={{ color: selectedCategory.color }} />;
                  })()}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                  {selectedCategory.name}
                </span>
                <span className="text-xs text-gray-400">Изменить</span>
              </button>
            )}

            {/* Category grid */}
            {(!selectedCategory || showAllCategories) && (
              <div className="space-y-2">
                {/* Search */}
                {filteredCategories.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('common.search')}
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
                  {filteredCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon || '');
                    const isSelected = String(cat.id) === categoryId;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoryId(String(cat.id));
                          setShowAllCategories(false);
                          setCatSearch('');
                        }}
                        className={clsx(
                          'flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center',
                          isSelected
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                        )}
                        title={cat.name}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <Icon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[10px] leading-tight font-medium text-gray-700 dark:text-gray-300 truncate w-full">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              placeholder={t('transactionsPage.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={clsx(
                'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-800 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.description
                  ? 'border-red-300'
                  : 'border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-gray-100',
              )}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Account + Date row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Account */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                <Wallet className="w-3.5 h-3.5" /> {t('transactionsPage.account')}
              </label>
              {(accounts ?? []).length === 0 && !showNewAccount ? (
                <button
                  onClick={() => setShowNewAccount(true)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                >
                  + {t('common.create', { defaultValue: 'Создать счёт' })}
                </button>
              ) : showNewAccount ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Например: Наличные, Карта Visa..."
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAccountName.trim()) {
                        createAccount.mutate(
                          { name: newAccountName.trim(), type: 'cash' as any, currency: 'USD' },
                          {
                            onSuccess: (acc) => {
                              setAccountId(String(acc.id));
                              setNewAccountName('');
                              setShowNewAccount(false);
                            },
                          },
                        );
                      }
                      if (e.key === 'Escape') {
                        setShowNewAccount(false);
                        setNewAccountName('');
                      }
                    }}
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newAccountName.trim()) {
                          createAccount.mutate(
                            { name: newAccountName.trim(), type: 'cash' as any, currency: 'USD' },
                            {
                              onSuccess: (acc) => {
                                setAccountId(String(acc.id));
                                setNewAccountName('');
                                setShowNewAccount(false);
                              },
                            },
                          );
                        }
                      }}
                      disabled={!newAccountName.trim()}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      Создать
                    </button>
                    <button
                      onClick={() => { setShowNewAccount(false); setNewAccountName(''); }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={accountId}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowNewAccount(true);
                      } else {
                        setAccountId(e.target.value);
                      }
                    }}
                    className={clsx(
                      'w-full px-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-800 appearance-none',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.accountId ? 'border-red-300' : 'border-gray-200 dark:border-gray-700',
                      'text-gray-900 dark:text-gray-100',
                    )}
                  >
                    <option value="">{t('transactionsPage.selectAccount')}</option>
                    {(accounts ?? []).map((a) => (
                      <option key={a.id} value={String(a.id)}>{a.name}</option>
                    ))}
                    <option value="__new__">+ Новый счёт...</option>
                  </select>
                </div>
              )}
              {errors.accountId && <p className="mt-1 text-xs text-red-500">{errors.accountId}</p>}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t('transactionsPage.date')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Время
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes — optional, collapsed */}
          <details className="group">
            <summary className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              {t('transactionsPage.notes')}
              <span className="text-[10px]">(опционально)</span>
            </summary>
            <textarea
              placeholder={t('transactionsPage.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </details>

          {/* Recurring toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Repeat className="w-3.5 h-3.5" />
              {t('transactionsPage.recurring')}
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createTransaction.isPending}
            className="flex-1"
          >
            {t('transactionsPage.addTransaction')}
          </Button>
        </div>
      </div>
    </div>
  );
}
