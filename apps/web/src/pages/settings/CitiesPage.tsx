// File: apps/web/src/pages/settings/CitiesPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { CityTable } from './CityTable';
import { CityFormModal } from './CityFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css'; // Reutilizamos estilos

// --- Tipos y Funciones de API ---
export interface City {
  id: string;
  name: string;
  created_at: string;
}

const fetchCities = async (): Promise<City[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('cities').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createCity = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('cities').insert({ name });
  if (error) throw new Error(error.message);
};

const updateCity = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('cities').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteCity = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal de la Página ---
export const CitiesPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  const queryClient = useQueryClient();

  const { data: cities, isLoading, error } = useQuery<City[], Error>({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['cities'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createCity, onSuccess: () => handleMutationSuccess('Ciudad creada'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateCity, onSuccess: () => handleMutationSuccess('Ciudad actualizada'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteCity, onSuccess: () => handleMutationSuccess('Ciudad eliminada'), onError: handleMutationError });

  const handleCloseModals = () => {
    setSelectedCity(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedCity(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (city: City) => {
    setSelectedCity(city);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (city: City) => {
    setSelectedCity(city);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (cityData: { id?: string; name: string }) => {
    if (cityData.id) {
      updateMutation.mutate({ id: cityData.id, name: cityData.name });
    } else {
      createMutation.mutate({ name: cityData.name });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCity) {
      deleteMutation.mutate(selectedCity.id);
    }
  };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Ciudades</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Ciudad
        </button>
      </header>

      {isLoading && <p>Cargando ciudades...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {cities && cities.length > 0 && (
        <CityTable cities={cities} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {cities && cities.length === 0 && <p>No se encontraron ciudades.</p>}

      <CityFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        cityToEdit={selectedCity}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la ciudad "${selectedCity?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};