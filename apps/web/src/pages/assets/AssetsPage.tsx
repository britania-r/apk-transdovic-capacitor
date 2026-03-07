// File: apps/web/src/pages/assets/AssetsPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { AssetsTable } from './AssetsTable';
import { AssetFormModal } from './AssetFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
export interface Category {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  category_id: string;
  subcategory_id: string | null;
  created_at: string;
  cost: number;
  category_name: string;
  subcategory_name: string | null;
}

// --- API ---
const fetchAssets = async (): Promise<Asset[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_assets_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchSubcategories = async (): Promise<Subcategory[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('subcategories').select('id, name, category_id').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertAsset = async (data: any) => {
  const { id, ...formData } = data;
  const query = id
    ? getSupabase().from('assets').update(formData).eq('id', id)
    : getSupabase().from('assets').insert([formData]);
  const { error } = await query;
  if (error) throw error;
};

const deleteAsset = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
};

// --- Componente ---
export const AssetsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<Asset[], Error>({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery<Subcategory[], Error>({
    queryKey: ['subcategories'],
    queryFn: fetchSubcategories,
  });

  const isLoading = isLoadingAssets || isLoadingCategories || isLoadingSubcategories;

  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return assets;
    return assets.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.category_name.toLowerCase().includes(q) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q)) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(q))
    );
  }, [assets, search]);

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => {
    if (error.message.includes('duplicate key value violates unique constraint')) {
      toast.error('Error: Ya existe un activo con ese número de serie.');
    } else {
      toast.error(`Error: ${error.message}`);
    }
  };

  const upsertMutation = useMutation({
    mutationFn: upsertAsset,
    onSuccess: (_d, variables) => handleMutationSuccess(variables.id ? 'Activo actualizado' : 'Activo creado exitosamente'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => handleMutationSuccess('Activo eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedAsset(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (data: any) => upsertMutation.mutate(data);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Activos Fijos</h1>
            <span className={styles.count}>{assets.length}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, categoría, marca o serie..."
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
            onClick={() => { setSelectedAsset(null); setFormModalOpen(true); }}
            className={styles.addBtn}
            disabled={isLoading}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo activo</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando activos...</span>
        </div>
      )}

      {!isLoading && filteredAssets.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-box"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay activos registrados'}</span>
        </div>
      )}

      {!isLoading && filteredAssets.length > 0 && (
        <AssetsTable
          assets={filteredAssets}
          onEdit={a => { setSelectedAsset(a); setFormModalOpen(true); }}
          onDelete={a => { setSelectedAsset(a); setConfirmModalOpen(true); }}
        />
      )}

      {categories.length > 0 && subcategories && (
        <AssetFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          assetToEdit={selectedAsset}
          categories={categories}
          subcategories={subcategories}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedAsset && deleteMutation.mutate(selectedAsset.id)}
        title="Eliminar activo"
        message={`¿Estás seguro de eliminar el activo "${selectedAsset?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};