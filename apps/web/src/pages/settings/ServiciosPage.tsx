// File: apps/web/src/pages/settings/ServiciosPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { ServiciosTable } from './ServiciosTable';
import { ServiciosFormModal } from './ServiciosFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// --- Tipos y Funciones de API para Servicios ---
export interface Servicio {
  id: string;
  name: string;
  created_at: string;
}

const fetchServicios = async (): Promise<Servicio[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('servicios').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createServicio = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('servicios').insert({ name });
  if (error) throw new Error(error.message);
};

const updateServicio = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('servicios').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteServicio = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('servicios').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal de la Página de Servicios ---
export const ServiciosPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  
  const queryClient = useQueryClient();

  const { data: servicios, isLoading, error } = useQuery<Servicio[], Error>({
    queryKey: ['servicios'],
    queryFn: fetchServicios,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['servicios'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({
    mutationFn: createServicio,
    onSuccess: () => handleMutationSuccess('Servicio creado exitosamente'),
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: updateServicio,
    onSuccess: () => handleMutationSuccess('Servicio actualizado exitosamente'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServicio,
    onSuccess: () => handleMutationSuccess('Servicio eliminado exitosamente'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedServicio(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedServicio(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (servicioData: { id?: string; name: string }) => {
    if (servicioData.id) {
      updateMutation.mutate({ id: servicioData.id, name: servicioData.name });
    } else {
      createMutation.mutate({ name: servicioData.name });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedServicio) {
      deleteMutation.mutate(selectedServicio.id);
    }
  };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Servicios</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Servicio
        </button>
      </header>

      {isLoading && <p>Cargando servicios...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {servicios && servicios.length > 0 && (
        <ServiciosTable servicios={servicios} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {servicios && servicios.length === 0 && <p>No se encontraron servicios.</p>}

      <ServiciosFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        servicioToEdit={selectedServicio}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el servicio "${selectedServicio?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};