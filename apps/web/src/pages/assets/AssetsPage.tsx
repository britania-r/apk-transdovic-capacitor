// File: apps/web/src/pages/assets/AssetsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { AssetsTable } from './AssetsTable';
import { AssetFormModal } from './AssetFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

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

export const AssetsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const queryClient = useQueryClient();

  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: fetchAssets });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({ queryKey: ['subcategories'], queryFn: fetchSubcategories });

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
    onSuccess: (d, variables) => handleMutationSuccess(variables.id ? 'Activo actualizado' : 'Activo creado'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => handleMutationSuccess('Activo eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setFormModalOpen(false); setConfirmModalOpen(false); setSelectedAsset(null); };
  const handleOpenCreateModal = () => { setSelectedAsset(null); setFormModalOpen(true); };
  const handleOpenEditModal = (asset: Asset) => { setSelectedAsset(asset); setFormModalOpen(true); };
  const handleOpenDeleteModal = (asset: Asset) => { setSelectedAsset(asset); setConfirmModalOpen(true); };
  const handleFormSubmit = (data: any) => upsertMutation.mutate(data);
  const handleDeleteConfirm = () => { if (selectedAsset) deleteMutation.mutate(selectedAsset.id); };
  
  const isLoading = isLoadingAssets || isLoadingCategories || isLoadingSubcategories;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Gestión de Activos Fijos</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton} disabled={isLoading}>
          <i className='bx bx-plus'></i> Agregar Activo
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {assets && <AssetsTable assets={assets} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}
      
      {categories && subcategories && (
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
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el activo "${selectedAsset?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};