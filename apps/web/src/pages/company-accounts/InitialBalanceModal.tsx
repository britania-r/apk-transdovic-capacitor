// File: apps/web/src/pages/account-statement/InitialBalanceModal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export const InitialBalanceModal = ({ isOpen, onClose, accountId }: Props) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().getFullYear() + '-01-01');

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().rpc('set_initial_balance', {
        p_account_id: accountId,
        p_amount: parseFloat(amount),
        p_date: date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Saldo inicial establecido');
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['company_accounts'] });
      onClose();
      setAmount('');
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    mutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-coin-stack"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Saldo Inicial</h3>
              <p className={styles.modalSubtitle}>
                Esto creará un registro de apertura. Si ya existía uno, se reemplazará.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            <div className={styles.field}>
              <label className={styles.label}>
                Fecha de apertura <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Monto inicial (S/ o $) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className={styles.input}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={mutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-save"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};