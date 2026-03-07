// File: apps/web/src/pages/farms/FarmsPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { APIProvider } from '@vis.gl/react-google-maps';

import { FarmTable } from './FarmTable';
import { FarmFormModal } from './FarmFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
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

// --- API ---
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

// --- Componente interno ---
const FarmsPageContent = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmWithCity | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: farms = [], isLoading: isLoadingFarms, error: errorFarms } = useQuery<FarmWithCity[], Error>({
    queryKey: ['farms'],
    queryFn: fetchFarms,
  });
  const { data: cities = [], isLoading: isLoadingCities, error: errorCities } = useQuery<City[], Error>({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const isLoading = isLoadingFarms || isLoadingCities;
  const error = errorFarms || errorCities;

  const filteredFarms = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return farms;
    return farms.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.ruc.includes(q) ||
      (f.city_name && f.city_name.toLowerCase().includes(q)) ||
      (f.address && f.address.toLowerCase().includes(q))
    );
  }, [farms, search]);

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['farms'] });
    handleCloseModals();
  };
  const handleMutationError = (e: Error) => toast.error(`Error: ${e.message}`);

  const createMutation = useMutation({
    mutationFn: createFarm,
    onSuccess: () => handleMutationSuccess('Granja creada exitosamente'),
    onError: handleMutationError,
  });
  const updateMutation = useMutation({
    mutationFn: updateFarm,
    onSuccess: () => handleMutationSuccess('Granja actualizada'),
    onError: handleMutationError,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFarm,
    onSuccess: () => handleMutationSuccess('Granja eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedFarm(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (farmData: Farm | Omit<Farm, 'id'>) => {
    if ('id' in farmData) {
      const { city_name, ...payload } = farmData as FarmWithCity;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(farmData);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Granjas</h1>
            <span className={styles.count}>{farms.length}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, RUC, ciudad o dirección..."
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
            onClick={() => { setSelectedFarm(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nueva granja</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando granjas...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredFarms.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-buildings"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay granjas registradas'}</span>
        </div>
      )}

      {!isLoading && filteredFarms.length > 0 && (
        <FarmTable
          farms={filteredFarms}
          onEdit={f => { setSelectedFarm(f); setFormModalOpen(true); }}
          onDelete={f => { setSelectedFarm(f); setConfirmModalOpen(true); }}
        />
      )}

      {cities.length > 0 && (
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
        onConfirm={() => selectedFarm && deleteMutation.mutate(selectedFarm.id)}
        title="Eliminar granja"
        message={`¿Estás seguro de eliminar la granja "${selectedFarm?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export const FarmsPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <FarmsPageContent />
  </APIProvider>
);