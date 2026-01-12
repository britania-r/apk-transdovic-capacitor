// File: apps/web/src/pages/farms/FarmsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { APIProvider } from '@vis.gl/react-google-maps';

import { FarmTable } from './FarmTable';
import { FarmFormModal } from './FarmFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// ============================================================================
// TIPOS Y FUNCIONES DE API
// ============================================================================

export interface Farm {
  id: string;
  name: string;
  ruc: string;
  city_id: string;
  address: string | null;
  notes: string | null;
  latitude: number;
  longitude: number;
  excel_formula: string | null;
}

export interface FarmWithCity extends Farm {
  city_name: string | null;
}

export interface City {
  id: string;
  name: string;
}

const fetchFarms = async (): Promise<FarmWithCity[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_farms_with_city');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCities = async (): Promise<City[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('cities').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createFarm = async (farmData: Omit<Farm, 'id'>) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('farms').insert(farmData);
  if (error) throw new Error(error.message);
};

const updateFarm = async (farmData: Farm) => {
  const { id, ...updateData } = farmData;
  const supabase = getSupabase();
  const { error } = await supabase.from('farms').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteFarm = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('farms').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ============================================================================
// COMPONENTE ORQUESTADOR
// ============================================================================

const FarmsPageContent = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmWithCity | null>(null);
  
  const queryClient = useQueryClient();

  const { data: farms, isLoading: isLoadingFarms, error: errorFarms } = useQuery<FarmWithCity[], Error>({ queryKey: ['farms'], queryFn: fetchFarms });
  const { data: cities, isLoading: isLoadingCities, error: errorCities } = useQuery<City[], Error>({ queryKey: ['cities'], queryFn: fetchCities });

  const handleMutationSuccess = (message: string) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ['farms'] }); handleCloseModals(); };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createFarm, onSuccess: () => handleMutationSuccess('Granja creada'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateFarm, onSuccess: () => handleMutationSuccess('Granja actualizada'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteFarm, onSuccess: () => handleMutationSuccess('Granja eliminada'), onError: handleMutationError });

  const handleCloseModals = () => { setSelectedFarm(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedFarm(null); setFormModalOpen(true); };
  const handleOpenEditModal = (farm: FarmWithCity) => { setSelectedFarm(farm); setFormModalOpen(true); };
  const handleOpenDeleteModal = (farm: FarmWithCity) => { setSelectedFarm(farm); setConfirmModalOpen(true); };

  const handleFormSubmit = (farmData: Farm | Omit<Farm, 'id'>) => {
    if ('id' in farmData) {
      // LA SOLUCIÓN: Quitamos 'city_name' antes de mandar a actualizar
      const { city_name, ...payload } = farmData as FarmWithCity;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(farmData);
    }
  };

  const handleDeleteConfirm = () => { if (selectedFarm) deleteMutation.mutate(selectedFarm.id); };
  
  const isLoading = isLoadingFarms || isLoadingCities;
  const error = errorFarms || errorCities;
  
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Gestión de Granjas</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Granja
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {farms && cities && <FarmTable farms={farms} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}

      {cities && (
        <FarmFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          farmToEdit={selectedFarm}
          isLoading={createMutation.isPending || updateMutation.isPending}
          cities={cities}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la granja "${selectedFarm?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ============================================================================
// COMPONENTE EXPORTADO
// ============================================================================
export const FarmsPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <FarmsPageContent />
  </APIProvider>
);