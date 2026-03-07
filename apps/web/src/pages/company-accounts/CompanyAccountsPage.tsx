// File: apps/web/src/pages/company-accounts/CompanyAccountsPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { CompanyAccountsTable } from './CompanyAccountsTable';
import { CompanyAccountFormModal } from './CompanyAccountFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { Bank } from '../settings/BanksPage';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
export interface CompanyAccount {
  id: string;
  bank_id: string | null;
  currency: string;
  account_number: string | null;
  created_at: string;
  bank_name: string;
  balance: number;
  account_type: 'BANCO' | 'CAJA';
}

// --- API ---
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

// --- Componente ---
export const CompanyAccountsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CompanyAccount | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<CompanyAccount[], Error>({
    queryKey: ['company_accounts'],
    queryFn: fetchCompanyAccounts,
  });
  const { data: banks = [], isLoading: isLoadingBanks } = useQuery<Bank[], Error>({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  });

  const isLoading = isLoadingAccounts || isLoadingBanks;

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(a =>
      a.bank_name.toLowerCase().includes(q) ||
      a.currency.toLowerCase().includes(q) ||
      (a.account_number && a.account_number.includes(q)) ||
      a.account_type.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['company_accounts'] });
    handleCloseModals();
  };
  const handleMutationError = (e: Error) => toast.error(`Error: ${e.message}`);

  const upsertMutation = useMutation({
    mutationFn: upsertCompanyAccount,
    onSuccess: (_d, variables) => handleMutationSuccess(variables.id ? 'Cuenta actualizada' : 'Cuenta creada exitosamente'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyAccount,
    onSuccess: () => handleMutationSuccess('Cuenta eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedAccount(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (data: any) => upsertMutation.mutate(data);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Cuentas y Cajas</h1>
            <span className={styles.count}>{accounts.length}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por banco, moneda o número..."
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

          {/* Botón nuevo */}
          <button
            onClick={() => { setSelectedAccount(null); setFormModalOpen(true); }}
            className={styles.addBtn}
            disabled={isLoading}
          >
            <i className="bx bx-plus"></i>
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando cuentas...</span>
        </div>
      )}

      {!isLoading && filteredAccounts.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-wallet"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay cuentas registradas'}</span>
        </div>
      )}

      {!isLoading && filteredAccounts.length > 0 && (
        <CompanyAccountsTable
          accounts={filteredAccounts}
          onEdit={a => { setSelectedAccount(a); setFormModalOpen(true); }}
          onDelete={a => { setSelectedAccount(a); setConfirmModalOpen(true); }}
        />
      )}

      {banks.length > 0 && (
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
        onConfirm={() => selectedAccount && deleteMutation.mutate(selectedAccount.id)}
        title="Eliminar cuenta"
        message={`¿Estás seguro de eliminar la cuenta ${selectedAccount?.account_number || selectedAccount?.bank_name}? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};