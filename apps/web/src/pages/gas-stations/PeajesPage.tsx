// File: apps/web/src/pages/gas-stations/PeajesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { APIProvider } from '@vis.gl/react-google-maps';

import { PeajeTable } from './PeajeTable';
import { PeajeFormModal } from './PeajeFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
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

// --- API ---
const fetchPeajes = async (): Promise<Peaje[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('gas_stations').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

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

// --- Componente interno ---
const PeajesPageContent = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPeaje, setSelectedPeaje] = useState<Peaje | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: peajes = [], isLoading, error } = useQuery<Peaje[], Error>({
    queryKey: ['peajes'],
    queryFn: fetchPeajes,
  });

  const filteredPeajes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return peajes;
    return peajes.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [peajes, search]);

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['peajes'] });
    handleCloseModals();
  };
  const handleMutationError = (e: Error) => toast.error(`Error: ${e.message}`);

  const createMutation = useMutation({
    mutationFn: createPeaje,
    onSuccess: () => handleMutationSuccess('Peaje creado exitosamente'),
    onError: handleMutationError,
  });
  const updateMutation = useMutation({
    mutationFn: updatePeaje,
    onSuccess: () => handleMutationSuccess('Peaje actualizado'),
    onError: handleMutationError,
  });
  const deleteMutation = useMutation({
    mutationFn: deletePeaje,
    onSuccess: () => handleMutationSuccess('Peaje eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedPeaje(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (peajeData: Peaje | Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => {
    if ('id' in peajeData) {
      updateMutation.mutate(peajeData);
    } else {
      createMutation.mutate(peajeData);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Peajes</h1>
            <span className={styles.count}>{peajes.length}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre o notas..."
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
            onClick={() => { setSelectedPeaje(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo peaje</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando peajes...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredPeajes.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-map-pin"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay peajes registrados'}</span>
        </div>
      )}

      {!isLoading && filteredPeajes.length > 0 && (
        <PeajeTable
          peajes={filteredPeajes}
          onEdit={p => { setSelectedPeaje(p); setFormModalOpen(true); }}
          onDelete={p => { setSelectedPeaje(p); setConfirmModalOpen(true); }}
        />
      )}

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
        onConfirm={() => selectedPeaje && deleteMutation.mutate(selectedPeaje.id)}
        title="Eliminar peaje"
        message={`¿Estás seguro de eliminar el peaje "${selectedPeaje?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export const PeajesPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <PeajesPageContent />
  </APIProvider>
);