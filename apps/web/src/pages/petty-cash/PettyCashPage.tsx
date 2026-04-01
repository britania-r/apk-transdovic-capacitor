// File: apps/web/src/pages/petty-cash/PettyCashPage.tsx
import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { PettyCashTable } from './PettyCashTable';
import { PettyCashDepositFormModal } from './PettyCashDepositFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Pagination } from '../../components/ui/Pagination';
import styles from '../users/UsersPage.module.css';
import localStyles from './PettyCashPage.module.css';

// --- Tipos ---
export interface PettyCashTransaction {
  id: string;
  transaction_date: string;
  amount: number;
  currency: string;
  description?: string;
  voucher_url?: string;
  user_name: string;
  document_number?: string;
  detail?: string;
  transaction_type: 'Ingreso' | 'Gasto' | 'Devolución';
}

interface Balance {
  currency: 'PEN' | 'USD';
  total_balance: number;
}

const formatCurrency = (value: number, currency: 'PEN' | 'USD') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency,
  }).format(value);

const ITEMS_PER_PAGE = 50;

// --- Componente ---
export const PettyCashPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PettyCashTransaction | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['pettyCashBalances'],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('get_petty_cash_balances');
      if (error) throw error;
      return data as Balance[];
    },
  });

  const { data: transactions = [], isLoading: isLoadingTransactions, error } = useQuery({
    queryKey: ['pettyCashTransactions'],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('get_petty_cash_list_v2');
      if (error) throw error;
      return (data || []) as PettyCashTransaction[];
    },
  });

  const isLoading = isLoadingBalances || isLoadingTransactions;

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(t =>
      t.transaction_type.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.user_name && t.user_name.toLowerCase().includes(q)) ||
      (t.document_number && t.document_number.toLowerCase().includes(q)) ||
      (t.detail && t.detail.toLowerCase().includes(q))
    );
  }, [transactions, search]);

  // Paginación
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset página al buscar
  useMemo(() => { setCurrentPage(1); }, [search]);

  const { penBalance, usdBalance } = useMemo(() => {
    const pen = balances?.find(b => b.currency === 'PEN')?.total_balance || 0;
    const usd = balances?.find(b => b.currency === 'USD')?.total_balance || 0;
    return { penBalance: pen, usdBalance: usd };
  }, [balances]);

  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['pettyCashBalances'] });
    queryClient.invalidateQueries({ queryKey: ['pettyCashTransactions'] });
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
    handleCloseModals();
  };

  const handleError = (err: any) => toast.error(`Error: ${err.message}`);

  const upsertMutation = useMutation({
    mutationFn: async (vars: any) => {
      const commonParams = {
        p_transaction_date: vars.date,
        p_description: vars.description || null,
        p_voucher_url: vars.voucherUrl || null,
        p_document_number: vars.document_number || null,
        p_detail: vars.detail || null,
      };

      if (vars.id) {
        const { error } = await getSupabase().rpc('update_petty_cash_transaction', {
          p_transaction_id: vars.id,
          ...commonParams,
        });
        if (error) throw error;
      } else {
        const { error } = await getSupabase().rpc('add_petty_cash_deposit', {
          p_amount: Number(vars.amount),
          p_currency: vars.currency,
          ...commonParams,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => handleSuccess(vars.id ? 'Registro actualizado' : 'Ingreso registrado exitosamente'),
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().rpc('delete_petty_cash_transaction', { p_transaction_id: id });
      if (error) throw error;
    },
    onSuccess: () => handleSuccess('Registro eliminado'),
    onError: handleError,
  });

  const handleCloseModals = () => {
    setSelectedTransaction(null);
    setIsFormOpen(false);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Caja Chica</h1>
            <span className={styles.count}>{transactions.length}</span>
          </div>

          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por tipo, descripción, usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => { setSelectedTransaction(null); setIsFormOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Registrar ingreso</span>
          </button>
        </div>
      </div>

      {/* ── Balance cards ── */}
      <div className={localStyles.balanceCards}>
        <div className={localStyles.balanceCard}>
          <div className={`${localStyles.balanceIcon} ${localStyles.balanceIconPen}`}>
            <i className="bx bx-money"></i>
          </div>
          <div>
            <span className={localStyles.balanceLabel}>Saldo en Soles</span>
            <span className={localStyles.balanceAmount}>
              {formatCurrency(penBalance, 'PEN')}
            </span>
          </div>
        </div>
        <div className={localStyles.balanceCard}>
          <div className={`${localStyles.balanceIcon} ${localStyles.balanceIconUsd}`}>
            <i className="bx bx-dollar"></i>
          </div>
          <div>
            <span className={localStyles.balanceLabel}>Saldo en Dólares</span>
            <span className={localStyles.balanceAmount}>
              {formatCurrency(usdBalance, 'USD')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div ref={tableRef}>
        {isLoading && (
          <div className={styles.stateBox}>
            <i className="bx bx-loader-alt bx-spin"></i>
            <span>Cargando movimientos...</span>
          </div>
        )}

        {error && (
          <div className={styles.stateBox}>
            <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
            <span>Error: {(error as Error).message}</span>
          </div>
        )}

        {!isLoading && !error && filteredTransactions.length === 0 && (
          <div className={styles.stateBox}>
            <i className="bx bx-wallet"></i>
            <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay movimientos registrados'}</span>
          </div>
        )}

        {!isLoading && paginatedTransactions.length > 0 && (
          <PettyCashTable
            transactions={paginatedTransactions}
            onEdit={t => { setSelectedTransaction(t); setIsFormOpen(true); }}
            onDelete={t => { setSelectedTransaction(t); setDeleteConfirmOpen(true); }}
          />
        )}
      </div>

      {/* ── Paginación ── */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredTransactions.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        scrollRef={tableRef as React.RefObject<HTMLElement>}
      />

      <PettyCashDepositFormModal
        isOpen={isFormOpen}
        onClose={handleCloseModals}
        onSubmit={data => upsertMutation.mutate(data)}
        isLoading={upsertMutation.isPending}
        transactionToEdit={selectedTransaction}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedTransaction && deleteMutation.mutate(selectedTransaction.id)}
        title="Eliminar registro"
        message="¿Estás seguro de eliminar este registro? Se revertirá el saldo. Esta acción es irreversible."
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};