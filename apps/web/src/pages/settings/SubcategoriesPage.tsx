// File: apps/web/src/pages/settings/SubcategoriesPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { SubcategoryTable } from './SubcategoryTable';
import { SubcategoryFormModal } from './SubcategoryFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
// --- CORRECCIÓN 1: Usar 'import type' para importar un tipo ---
import type { Category } from './CategoriesPage';
import styles from '../users/UsersPage.module.css';

// --- Tipos y Funciones de API (sin cambios) ---
export interface SubcategoryWithCategory {
  id: string;
  name: string;
  created_at: string;
  category_id: string;
  category_name: string;
}

const fetchSubcategories = async (): Promise<SubcategoryWithCategory[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_subcategories_with_category');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createSubcategory = async (data: { name: string; category_id: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('subcategories').insert(data);
  if (error) throw new Error(error.message);
};

const updateSubcategory = async (data: { id: string; name: string; category_id: string }) => {
  const { id, ...updateData } = data;
  const supabase = getSupabase();
  const { error } = await supabase.from('subcategories').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteSubcategory = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal ---
export const SubcategoriesPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryWithCategory | null>(null);
  
  const queryClient = useQueryClient();

  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({ queryKey: ['subcategories'], queryFn: fetchSubcategories });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({ mutationFn: createSubcategory, onSuccess: () => handleMutationSuccess('Subcategoría creada'), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateSubcategory, onSuccess: () => handleMutationSuccess('Subcategoría actualizada'), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteSubcategory, onSuccess: () => handleMutationSuccess('Subcategoría eliminada'), onError: handleMutationError });

  const handleCloseModals = () => { setSelectedSubcategory(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedSubcategory(null); setFormModalOpen(true); };
  const handleOpenEditModal = (sub: SubcategoryWithCategory) => { setSelectedSubcategory(sub); setFormModalOpen(true); };
  const handleOpenDeleteModal = (sub: SubcategoryWithCategory) => { setSelectedSubcategory(sub); setConfirmModalOpen(true); };

  // --- CORRECCIÓN 2: Ser más explícitos con los datos para la mutación ---
  const handleFormSubmit = (data: { id?: string; name: string; category_id: string }) => {
    if (data.id) {
      // Para actualizar, los datos ya tienen la forma correcta
      updateMutation.mutate(data as { id: string; name: string; category_id: string });
    } else {
      // Para crear, solo pasamos los campos que la función espera
      const { name, category_id } = data;
      createMutation.mutate({ name, category_id });
    }
  };

  const handleDeleteConfirm = () => { if (selectedSubcategory) deleteMutation.mutate(selectedSubcategory.id); };
  
  const isLoading = isLoadingSubcategories || isLoadingCategories;

  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Subcategorías</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton} disabled={!categories || categories.length === 0}>
          <i className='bx bx-plus'></i> Crear Subcategoría
        </button>
      </header>
      {categories?.length === 0 && <p>Primero debes crear al menos una categoría.</p>}

      {isLoading && <p>Cargando datos...</p>}
      
      {subcategories && <SubcategoryTable subcategories={subcategories} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}

      {categories && (
        <SubcategoryFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          subcategoryToEdit={selectedSubcategory}
          categories={categories}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la subcategoría "${selectedSubcategory?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};