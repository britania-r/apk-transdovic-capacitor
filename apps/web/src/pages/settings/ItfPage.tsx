// File: apps/web/src/pages/settings/ItfPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { ItfTable } from './ItfTable';
import { ItfFormModal } from './ItfFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// CAMBIO 1: Actualizamos la interfaz
export interface ItfRate {
  id: string;
  range_start: number;
  range_end: number;
  fixed_amount: number; // Antes 'percentage'
  created_at: string;
}

const fetchItfRates = async (): Promise<ItfRate[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('itf_rates').select('*').order('range_start');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertItfRate = async (rateData: Partial<ItfRate>) => {
  const { id, ...dataToSave } = rateData;
  const query = id
    ? getSupabase().from('itf_rates').update(dataToSave).eq('id', id)
    : getSupabase().from('itf_rates').insert([dataToSave]);
  const { error } = await query;
  if (error) throw new Error(error.message);
};

const deleteItfRate = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('itf_rates').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const ItfPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ItfRate | null>(null);
  
  const queryClient = useQueryClient();

  const { data: itfRates, isLoading } = useQuery<ItfRate[], Error>({
    queryKey: ['itfRates'],
    queryFn: fetchItfRates,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['itfRates'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const upsertMutation = useMutation({
    mutationFn: upsertItfRate,
    onSuccess: (_, variables) => handleMutationSuccess(variables.id ? 'Tasa ITF actualizada' : 'Tasa ITF creada'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItfRate,
    onSuccess: () => handleMutationSuccess('Tasa ITF eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setSelectedRate(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedRate(null); setFormModalOpen(true); };
  const handleOpenEditModal = (rate: ItfRate) => { setSelectedRate(rate); setFormModalOpen(true); };
  const handleOpenDeleteModal = (rate: ItfRate) => { setSelectedRate(rate); setConfirmModalOpen(true); };
  const handleFormSubmit = (data: Partial<ItfRate>) => upsertMutation.mutate(data);
  const handleDeleteConfirm = () => { if (selectedRate) deleteMutation.mutate(selectedRate.id); };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Configuración ITF (Monto Fijo)</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Rango
        </button>
      </header>

      {isLoading && <p>Cargando configuración...</p>}
      
      {itfRates && (
        <ItfTable rates={itfRates} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}

      <ItfFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        rateToEdit={selectedRate}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar este rango?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};