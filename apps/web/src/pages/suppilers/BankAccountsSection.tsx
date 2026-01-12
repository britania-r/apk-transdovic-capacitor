// File: apps/web/src/pages/suppliers/BankAccountsSection.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { BankAccount } from './SuppliersDetailsPage';
import type { Bank } from '../settings/BanksPage';
import { BankAccountsTable } from './BankAccountsTable';
import { BankAccountFormModal } from './BankAccountFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

interface Props { supplierId: string; initialBankAccounts: BankAccount[]; banks: Bank[]; }
type BankAccountFormData = Omit<BankAccount, 'id' | 'bank_name'>;

export const BankAccountsSection = ({ supplierId, initialBankAccounts, banks }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const queryClient = useQueryClient();

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string } & Omit<BankAccountFormData, 'id'>) => {
      const { id, ...formData } = data;
      const dataToSubmit = { ...formData, supplier_id: supplierId };
      const query = id ? getSupabase().from('supplier_bank_accounts').update(dataToSubmit).eq('id', id) : getSupabase().from('supplier_bank_accounts').insert(dataToSubmit);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (data, variables) => handleMutationSuccess(variables.id ? 'Cuenta actualizada' : 'Cuenta agregada'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_bank_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => handleMutationSuccess('Cuenta eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setModalOpen(false); setConfirmOpen(false); setSelectedAccount(null); };
  const handleSubmit = (data) => upsertMutation.mutate(data);
  const handleDelete = () => { if (selectedAccount) deleteMutation.mutate(selectedAccount.id); };

  return (
    <div>
      <div className={styles.tableActions}>
        <button onClick={() => { setSelectedAccount(null); setModalOpen(true); }} className={styles.addButton}><i className='bx bx-plus'></i> Agregar Cuenta</button>
      </div>
      
      <BankAccountsTable accounts={initialBankAccounts} onEdit={(acc) => { setSelectedAccount(acc); setModalOpen(true); }} onDelete={(acc) => { setSelectedAccount(acc); setConfirmOpen(true); }} />
      <BankAccountFormModal isOpen={isModalOpen} onClose={handleCloseModals} onSubmit={handleSubmit} accountToEdit={selectedAccount} banks={banks} isLoading={upsertMutation.isPending} />
      <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDelete} title="Confirmar Eliminación" message={`¿Seguro que quieres eliminar la cuenta ${selectedAccount?.account_number}?`} isLoading={deleteMutation.isPending} />
    </div>
  );
};