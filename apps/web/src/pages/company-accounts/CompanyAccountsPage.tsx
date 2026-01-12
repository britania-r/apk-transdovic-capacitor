import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { CompanyAccountsTable } from './CompanyAccountsTable';
import { CompanyAccountFormModal } from './CompanyAccountFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { Bank } from '../settings/BanksPage';
import styles from '../users/UsersPage.module.css';

// --- Tipos Actualizados ---
export interface CompanyAccount {
  id: string;
  bank_id: string | null; // Ahora puede ser null (Cajas)
  currency: string;
  account_number: string | null; // Ahora puede ser null (Cajas)
  created_at: string;
  bank_name: string;
  balance: number;
  account_type: 'BANCO' | 'CAJA'; // <--- NUEVO CAMPO
}

const fetchCompanyAccounts = async (): Promise<CompanyAccount[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_company_accounts_with_bank');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchBanks = async (): Promise<Bank[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('banks').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertCompanyAccount = async (data: any) => {
  const { id, ...formData } = data;
  const query = id
    ? getSupabase().from('company_bank_accounts').update(formData).eq('id', id)
    : getSupabase().from('company_bank_accounts').insert([formData]);
  const { error } = await query;
  if (error) throw error;
};

const deleteCompanyAccount = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('company_bank_accounts').delete().eq('id', id);
  if (error) throw error;
};

export const CompanyAccountsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CompanyAccount | null>(null);
  
  const queryClient = useQueryClient();

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({ queryKey: ['company_accounts'], queryFn: fetchCompanyAccounts });
  const { data: banks, isLoading: isLoadingBanks } = useQuery({ queryKey: ['banks'], queryFn: fetchBanks });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['company_accounts'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: upsertCompanyAccount,
    onSuccess: (d, variables) => handleMutationSuccess(variables.id ? 'Cuenta actualizada' : 'Cuenta creada'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyAccount,
    onSuccess: () => handleMutationSuccess('Cuenta eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setFormModalOpen(false); setConfirmModalOpen(false); setSelectedAccount(null); };
  const handleOpenCreateModal = () => { setSelectedAccount(null); setFormModalOpen(true); };
  const handleOpenEditModal = (account: CompanyAccount) => { setSelectedAccount(account); setFormModalOpen(true); };
  const handleOpenDeleteModal = (account: CompanyAccount) => { setSelectedAccount(account); setConfirmModalOpen(true); };
  const handleFormSubmit = (data: any) => upsertMutation.mutate(data);
  const handleDeleteConfirm = () => { if (selectedAccount) deleteMutation.mutate(selectedAccount.id); };
  
  const isLoading = isLoadingAccounts || isLoadingBanks;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Cuentas y Cajas</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton} disabled={isLoading}>
          <i className='bx bx-plus'></i> Agregar Cuenta
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {accounts && <CompanyAccountsTable accounts={accounts} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}
      
      {banks && (
        <CompanyAccountFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          accountToEdit={selectedAccount}
          banks={banks}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la cuenta ${selectedAccount?.account_number || selectedAccount?.bank_name}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};