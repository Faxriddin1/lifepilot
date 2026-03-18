import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, Shield, ShieldOff, UserCheck, UserX, Eye } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/api/admin';
import { showApiError, showSuccess } from '@/utils/errorHandler';

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface Props {
  resource: string;
  title: string;
  columns: ColumnDef[];
  searchable?: boolean;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  isUsers?: boolean;
}

/** Универсальная CRUD-страница для админ-панели. */
export function AdminResourcePage({ resource, title, columns, searchable, filters, isUsers }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [detailItem, setDetailItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search) params.search = search;
  Object.entries(filterValues).forEach(([k, v]) => {
    if (v) params[k] = v;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', resource, params],
    queryFn: () => adminApi.getList(resource, params),
    staleTime: 10000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteItem(resource, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', resource] });
      showSuccess('Удалено');
      setDeleteConfirm(null);
    },
    onError: showApiError,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', resource] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      showSuccess('Статус изменён');
    },
    onError: showApiError,
  });

  const toggleStaffMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', resource] });
      showSuccess('Роль изменена');
    },
    onError: showApiError,
  });

  const results = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} записей</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {searchable && (
          <div className="w-72">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        )}
        {filters?.map((f) => (
          <select
            key={f.key}
            value={filterValues[f.key] || ''}
            onChange={(e) => { setFilterValues(p => ({ ...p, [f.key]: e.target.value })); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">{f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Нет данных</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400" style={{ width: col.width }}>
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400 w-40">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {col.render ? col.render(row[col.key], row) : (
                          <span className="truncate block max-w-xs">
                            {row[col.key] === true ? '✅' : row[col.key] === false ? '❌' : (row[col.key] ?? '—')}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailItem(row)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isUsers && (
                          <>
                            <button
                              onClick={() => toggleActiveMutation.mutate(row.id)}
                              className={clsx('p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                                row.is_active ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'
                              )}
                              title={row.is_active ? 'Деактивировать' : 'Активировать'}
                            >
                              {row.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => toggleStaffMutation.mutate(row.id)}
                              className={clsx('p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                                row.is_staff ? 'text-amber-500' : 'text-gray-400'
                              )}
                              title={row.is_staff ? 'Снять админа' : 'Назначить админом'}
                            >
                              {row.is_staff ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(row.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">Стр. {page} из {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Детали записи">
        {detailItem && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {Object.entries(detailItem).map(([key, val]) => (
              <div key={key} className="flex gap-3 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-36 flex-shrink-0">{key}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
                  {val === true ? '✅ true' : val === false ? '❌ false' : val === null ? 'null' : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Подтвердите удаление">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Вы уверены что хотите удалить эту запись? Это действие нельзя отменить.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
