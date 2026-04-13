// File: apps/web/src/pages/vehicles/VehiclesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { VehicleTable } from './VehicleTable';
import { VehicleFormModal } from './VehicleFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
export interface Vehicle {
  id: string;
  plate: string;
  capacity_kg: number | null;
  tuse: string | null;
}

// --- API ---
const fetchVehicles = async (): Promise<Vehicle[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, plate, capacity_kg, tuse')
    .order('plate');
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

// --- Componente ---
export const VehiclesPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading, error } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const filteredVehicles = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return vehicles;
    return vehicles.filter(v =>
  v.plate.toLowerCase().includes(q) ||
  (v.capacity_kg?.toString().includes(q) ?? false) ||
  (v.tuse && v.tuse.toLowerCase().includes(q))
);
  }, [vehicles, search]);

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    handleCloseModals();
  };
  const handleMutationError = (e: Error) => toast.error(`Error: ${e.message}`);

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => handleMutationSuccess('Vehículo creado exitosamente'),
    onError: handleMutationError,
  });
  const updateMutation = useMutation({
    mutationFn: updateVehicle,
    onSuccess: () => handleMutationSuccess('Vehículo actualizado'),
    onError: handleMutationError,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => handleMutationSuccess('Vehículo eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedVehicle(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (vehicleData: Omit<Vehicle, 'id'> | Vehicle) => {
    if ('id' in vehicleData) {
      updateMutation.mutate(vehicleData);
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Vehículos</h1>
            <span className={styles.count}>{vehicles.length}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por placa, capacidad o TUSE..."
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
            onClick={() => { setSelectedVehicle(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo vehículo</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando vehículos...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredVehicles.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-car"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay vehículos registrados'}</span>
        </div>
      )}

      {!isLoading && filteredVehicles.length > 0 && (
        <VehicleTable
          vehicles={filteredVehicles}
          onEdit={v => { setSelectedVehicle(v); setFormModalOpen(true); }}
          onDelete={v => { setSelectedVehicle(v); setConfirmModalOpen(true); }}
        />
      )}

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
        onConfirm={() => selectedVehicle && deleteMutation.mutate(selectedVehicle.id)}
        title="Eliminar vehículo"
        message={`¿Estás seguro de eliminar el vehículo ${selectedVehicle?.plate}? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};