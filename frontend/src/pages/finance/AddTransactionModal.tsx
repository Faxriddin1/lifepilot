import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCreateTransaction, useAccounts, useCategories } from '@/hooks/useFinance';
import { TransactionType, type CreateTransactionData } from '@/types';
import { validateTransactionForm } from '@/utils/validation';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Модальное окно создания транзакции с выбором типа, категории, счёта и суммы. */
export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const createTransaction = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  const filteredCategories = (categories ?? []).filter(
    (c) =>
      (type === TransactionType.INCOME && c.type === 'income') ||
      (type === TransactionType.EXPENSE && c.type === 'expense') ||
      type === TransactionType.TRANSFER
  );

  const handleSubmit = () => {
    const validationErrors = validateTransactionForm(amount, description, accountId);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const data: CreateTransactionData = {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category_id: categoryId || null,
      account_id: accountId,
      date,
      notes: notes || undefined,
      is_recurring: isRecurring,
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        onClose();
        setAmount('');
        setDescription('');
        setCategoryId('');
        setNotes('');
        setIsRecurring(false);
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactionsPage.addTransaction')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={createTransaction.isPending}>
            {t('transactionsPage.addTransaction')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('transactionsPage.type')}
          </label>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {[
              { value: TransactionType.EXPENSE, label: t('transactionsPage.expense'), color: 'text-danger-600' },
              { value: TransactionType.INCOME, label: t('transactionsPage.income'), color: 'text-success-600' },
              { value: TransactionType.TRANSFER, label: t('transactionsPage.transfer'), color: 'text-primary-600' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  type === opt.value
                    ? `bg-white dark:bg-gray-900 shadow-sm ${opt.color}`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={t('transactionsPage.amount')}
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          step="0.01"
          min="0"
        />

        <Input
          label={t('transactionsPage.description')}
          placeholder={t('transactionsPage.descPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('transactionsPage.category')}
            placeholder={t('transactionsPage.selectCategory')}
            options={[
              { value: '', label: t('transactionsPage.noCategory') },
              ...filteredCategories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <Select
            label={t('transactionsPage.account')}
            placeholder={t('transactionsPage.selectAccount')}
            options={(accounts ?? []).map((a) => ({
              value: String(a.id),
              label: a.name,
            }))}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            error={errors.accountId}
          />
        </div>

        <Input
          label={t('transactionsPage.date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label={t('transactionsPage.notes')}
          placeholder={t('transactionsPage.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('transactionsPage.recurring')}</span>
        </label>
      </div>
    </Modal>
  );
}
