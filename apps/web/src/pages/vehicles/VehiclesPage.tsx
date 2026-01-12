// File: apps/web/src/pages/vehicles/VehiclesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { VehicleTable } from './VehicleTable';
import { VehicleFormModal } from './VehicleFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// --- Tipos y Funciones de API ---
export interface Vehicle {
  id: string;
  plate: string;
  capacity_kg: number;
  tuse: string | null;
}

const fetchVehicles = async (): Promise<Vehicle[]> => {
  const supabase = getSupabase();
  // Se quita 'name' del select
  const { data, error } = await supabase.from('vehicles').select('id, plate, capacity_kg, tuse').order('plate');
  if (error) throw new Error(error.message);
  return data || [];
};

const createVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('vehicles').insert(vehicleData);
  if (error) throw new Error(error.message);
};

const updateVehicle = async (vehicleData: Vehicle) => {
  const { id, ...updateData } = vehicleData;
  const supabase = getSupabase();
  const { error } = await supabase.from('vehicles').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteVehicle = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal ---
export const VehiclesPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading, error } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createVehicle, onSuccess: () => handleMutationSuccess('Vehículo creado'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateVehicle, onSuccess: () => handleMutationSuccess('Vehículo actualizado'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteVehicle, onSuccess: () => handleMutationSuccess('Vehículo eliminado'), onError: handleMutationError });

  const handleCloseModals = () => {
    setSelectedVehicle(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedVehicle(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (vehicleData: Omit<Vehicle, 'id'> | Vehicle) => {
    if ('id' in vehicleData) {
      updateMutation.mutate(vehicleData);
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedVehicle) {
      deleteMutation.mutate(selectedVehicle.id);
    }
  };
  
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Vehículos</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Vehículo
        </button>
      </header>

      {isLoading && <p>Cargando vehículos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {vehicles && vehicles.length > 0 && (
        <VehicleTable vehicles={vehicles} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {vehicles && vehicles.length === 0 && <p>No se encontraron vehículos.</p>}

      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        vehicleToEdit={selectedVehicle}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el vehículo con placa "${selectedVehicle?.plate}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};