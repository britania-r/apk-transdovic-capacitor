import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { PettyCashTable } from './PettyCashTable';
import { PettyCashDepositFormModal } from './PettyCashDepositFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './PettyCashPage.module.css';

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

const formatCurrency = (value: number, currency: 'PEN' | 'USD') => new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
  style: 'currency',
  currency,
}).format(value);

export const PettyCashPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PettyCashTransaction | null>(null);
  const queryClient = useQueryClient();

  // 1. Obtener Saldos
  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['pettyCashBalances'],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('get_petty_cash_balances');
      if (error) throw error;
      return data as Balance[];
    },
  });

  // 2. Obtener Historial
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['pettyCashTransactions'],
    queryFn: async () => {
      // Usamos la versión corregida 'v2' o la debug si prefieres, 
      // pero idealmente deberías tener un 'get_petty_cash_list_v2' estable.
      const { data, error } = await getSupabase().rpc('get_petty_cash_list_v2'); 
      if (error) throw error;
      return data as PettyCashTransaction[];
    },
  });

  // 3. Mutaciones (Crear / Editar / Eliminar)
  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['pettyCashBalances'] });
    queryClient.invalidateQueries({ queryKey: ['pettyCashTransactions'] });
    // También invalidamos el ledger para que se refresque la vista unificada
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
    
    setIsFormOpen(false);
    setDeleteConfirmOpen(false);
    setSelectedTransaction(null);
  };

  const handleError = (err: any) => toast.error(`Error: ${err.message}`);

  const upsertMutation = useMutation({
    mutationFn: async (vars: any) => {
      const commonParams = {
        p_transaction_date: vars.date,
        p_description: vars.description || null,
        p_voucher_url: vars.voucherUrl || null,
        p_document_number: vars.document_number || null,
        p_detail: vars.detail || null
      };

      if (vars.id) {
        // UPDATE
        const { error } = await getSupabase().rpc('update_petty_cash_transaction', {
          p_transaction_id: vars.id,
          ...commonParams
        }); 
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await getSupabase().rpc('add_petty_cash_deposit', {
          p_amount: Number(vars.amount),
          p_currency: vars.currency,
          ...commonParams
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => handleSuccess(vars.id ? 'Registro actualizado' : 'Ingreso registrado'),
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

  const handleDeleteConfirm = () => {
    if (selectedTransaction) deleteMutation.mutate(selectedTransaction.id);
  };

  const { penBalance, usdBalance } = useMemo(() => {
    const pen = balances?.find(b => b.currency === 'PEN')?.total_balance || 0;
    const usd = balances?.find(b => b.currency === 'USD')?.total_balance || 0;
    return { penBalance: pen, usdBalance: usd };
  }, [balances]);

  const isLoading = isLoadingBalances || isLoadingTransactions;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Control de Caja Chica</h1>
        <button onClick={() => { setSelectedTransaction(null); setIsFormOpen(true); }} className={styles.addButton}>
          <i className='bx bx-plus'></i> Registrar Ingreso
        </button>
      </header>

      <div className={styles.balanceCards}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Saldo en Soles (PEN)</span>
          <span className={styles.cardAmount}>{formatCurrency(penBalance, 'PEN')}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Saldo en Dólares (USD)</span>
          <span className={styles.cardAmount}>{formatCurrency(usdBalance, 'USD')}</span>
        </div>
      </div>

      <div className={styles.tableSection}>
        <h2>Historial de Movimientos</h2>
        {isLoading && <p>Cargando transacciones...</p>}
        
        {transactions && transactions.length > 0 ? (
          <PettyCashTable 
            transactions={transactions} 
            onEdit={(t) => { setSelectedTransaction(t); setIsFormOpen(true); }}
            onDelete={(t) => { setSelectedTransaction(t); setDeleteConfirmOpen(true); }}
          />
        ) : (
            !isLoading && <p>No hay registros.</p>
        )}
      </div>
      
      <PettyCashDepositFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(data) => upsertMutation.mutate(data)}
        isLoading={upsertMutation.isPending}
        transactionToEdit={selectedTransaction}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este registro? Se revertirá el saldo."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};