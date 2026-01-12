// File: apps/web/src/pages/gas-stations/PeajesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared'; // CORRECCIÓN: Sin importar 'Database'
import { APIProvider } from '@vis.gl/react-google-maps';

import { PeajeTable } from './PeajeTable';
import { PeajeFormModal } from './PeajeFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// ============================================================================
// TIPOS Y FUNCIONES DE API
// ============================================================================

// CORRECCIÓN: Definimos los tipos localmente, igual que en FarmsPage.tsx
export interface Peaje {
  id: string;
  name: string;
  billing_frequency: number;
  notes: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string | null;
}

const fetchPeajes = async (): Promise<Peaje[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('gas_stations').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

// El DTO para crear se basa en el tipo local
const createPeaje = async (peajeData: Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('gas_stations').insert(peajeData);
  if (error) throw new Error(error.message);
};

const updatePeaje = async (peajeData: Peaje) => {
  const { id, created_at, updated_at, ...updateData } = peajeData;
  const supabase = getSupabase();
  const { error } = await supabase.from('gas_stations').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
};

const deletePeaje = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('gas_stations').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ============================================================================
// COMPONENTE ORQUESTADOR (El resto del archivo permanece igual)
// ============================================================================

const PeajesPageContent = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPeaje, setSelectedPeaje] = useState<Peaje | null>(null);
  
  const queryClient = useQueryClient();

  const { data: peajes, isLoading, error } = useQuery<Peaje[], Error>({ queryKey: ['peajes'], queryFn: fetchPeajes });

  const handleMutationSuccess = (message: string) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ['peajes'] }); handleCloseModals(); };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createPeaje, onSuccess: () => handleMutationSuccess('Peaje creado'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updatePeaje, onSuccess: () => handleMutationSuccess('Peaje actualizado'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deletePeaje, onSuccess: () => handleMutationSuccess('Peaje eliminado'), onError: handleMutationError });

  const handleCloseModals = () => { setSelectedPeaje(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedPeaje(null); setFormModalOpen(true); };
  const handleOpenEditModal = (peaje: Peaje) => { setSelectedPeaje(peaje); setFormModalOpen(true); };
  const handleOpenDeleteModal = (peaje: Peaje) => { setSelectedPeaje(peaje); setConfirmModalOpen(true); };

  const handleFormSubmit = (peajeData: Peaje | Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => {
    if ('id' in peajeData) {
      updateMutation.mutate(peajeData);
    } else {
      createMutation.mutate(peajeData);
    }
  };

  const handleDeleteConfirm = () => { if (selectedPeaje) deleteMutation.mutate(selectedPeaje.id); };
  
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Gestión de Peajes</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Peaje
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {peajes && <PeajeTable peajes={peajes} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}

      <PeajeFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        peajeToEdit={selectedPeaje}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el peaje "${selectedPeaje?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export const PeajesPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <PeajesPageContent />
  </APIProvider>
);