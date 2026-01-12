// File: apps/web/src/pages/settings/UnitsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { UnitTable } from './UnitTable';
import { UnitFormModal } from './UnitFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css'; // Reutilizamos estilos

// --- Tipos y Funciones de API ---
export interface Unit {
  id: string;
  name: string;
  created_at: string;
}

const fetchUnits = async (): Promise<Unit[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('units').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createUnit = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('units').insert({ name });
  if (error) throw new Error(error.message);
};

const updateUnit = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('units').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteUnit = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal de la Página ---
export const UnitsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  
  const queryClient = useQueryClient();

  const { data: units, isLoading, error } = useQuery<Unit[], Error>({
    queryKey: ['units'],
    queryFn: fetchUnits,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['units'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createUnit, onSuccess: () => handleMutationSuccess('Unidad creada'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateUnit, onSuccess: () => handleMutationSuccess('Unidad actualizada'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteUnit, onSuccess: () => handleMutationSuccess('Unidad eliminada'), onError: handleMutationError });

  const handleCloseModals = () => {
    setSelectedUnit(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedUnit(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (unitData: { id?: string; name: string }) => {
    if (unitData.id) {
      updateMutation.mutate({ id: unitData.id, name: unitData.name });
    } else {
      createMutation.mutate({ name: unitData.name });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedUnit) {
      deleteMutation.mutate(selectedUnit.id);
    }
  };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Unidades</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Unidad
        </button>
      </header>

      {isLoading && <p>Cargando unidades...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {units && units.length > 0 && (
        <UnitTable units={units} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {units && units.length === 0 && <p>No se encontraron unidades.</p>}

      <UnitFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        unitToEdit={selectedUnit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la unidad "${selectedUnit?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};