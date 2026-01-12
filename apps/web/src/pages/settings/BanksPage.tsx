// File: apps/web/src/pages/settings/BanksPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { BankTable } from './BankTable';
import { BankFormModal } from './BankFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos y Funciones de API ---
export interface Bank {
  id: string;
  name: string;
  created_at: string;
}

const fetchBanks = async (): Promise<Bank[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('banks').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createBank = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('banks').insert({ name });
  if (error) throw new Error(error.message);
};

const updateBank = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('banks').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteBank = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('banks').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal ---
export const BanksPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  
  const queryClient = useQueryClient();

  const { data: banks, isLoading, error } = useQuery<Bank[], Error>({ queryKey: ['banks'], queryFn: fetchBanks });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['banks'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createBank, onSuccess: () => handleMutationSuccess('Banco creado'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateBank, onSuccess: () => handleMutationSuccess('Banco actualizado'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteBank, onSuccess: () => handleMutationSuccess('Banco eliminado'), onError: handleMutationError });

  const handleCloseModals = () => { setSelectedBank(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedBank(null); setFormModalOpen(true); };
  const handleOpenEditModal = (bank: Bank) => { setSelectedBank(bank); setFormModalOpen(true); };
  const handleOpenDeleteModal = (bank: Bank) => { setSelectedBank(bank); setConfirmModalOpen(true); };

  const handleFormSubmit = (bankData: { id?: string; name: string }) => {
    if (bankData.id) {
      updateMutation.mutate({ id: bankData.id, name: bankData.name });
    } else {
      createMutation.mutate({ name: bankData.name });
    }
  };

  const handleDeleteConfirm = () => { if (selectedBank) { deleteMutation.mutate(selectedBank.id); } };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Bancos</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}><i className='bx bx-plus'></i> Crear Banco</button>
      </header>

      {isLoading && <p>Cargando bancos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {banks && banks.length > 0 && <BankTable banks={banks} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}
      {banks && banks.length === 0 && <p>No se encontraron bancos.</p>}

      <BankFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        bankToEdit={selectedBank}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el banco "${selectedBank?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};