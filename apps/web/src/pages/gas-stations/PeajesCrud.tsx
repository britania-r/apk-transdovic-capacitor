// File: apps/web/src/pages/gas-stations/PeajesCrud.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { PeajeTable } from './PeajeTable';
import { PeajeFormModal } from './PeajeFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { Peaje } from './PeajesPage';
import styles from '../users/UsersPage.module.css';

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

export const PeajesCrud = () => {
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
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.tag_covisol && p.tag_covisol.toLowerCase().includes(q)) ||
      (p.tag_comsatel && p.tag_comsatel.toLowerCase().includes(q))
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
    <>
      {/* Header interno */}
      <div className={styles.pageHeader} style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Peajes</h1>
            <span className={styles.count}>{peajes.length}</span>
          </div>

          <div className={styles.searchBar} style={{ flex: 1 }}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, notas o tags..."
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

          <button
            onClick={() => { setSelectedPeaje(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo peaje</span>
          </button>
        </div>
      </div>

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
    </>
  );
};