import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import styles from '../users/UserFormModal.module.css'; // Reutilizamos tus estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export const InitialBalanceModal = ({ isOpen, onClose, accountId }: Props) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().getFullYear() + '-01-01'); // Por defecto 1ero Enero
  
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().rpc('set_initial_balance', {
        p_account_id: accountId,
        p_amount: parseFloat(amount),
        p_date: date
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Saldo inicial establecido');
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['company_accounts'] }); // Para actualizar tabla cuentas
      onClose();
      setAmount('');
    },
    onError: (err: any) => toast.error('Error: ' + err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    mutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Establecer Saldo Inicial</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          Esto creará un registro de apertura. Si ya existía uno, se reemplazará.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Fecha de Apertura</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Monto Inicial (S/ o $)</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00"
              required 
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};