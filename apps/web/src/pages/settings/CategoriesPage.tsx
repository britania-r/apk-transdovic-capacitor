// File: apps/web/src/pages/settings/CategoriesPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { CategoryTable } from './CategoryTable';
import { CategoryFormModal } from './CategoryFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// --- Tipos y Funciones de API ---
export interface Category {
  id: string;
  name: string;
  created_at: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createCategory = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw new Error(error.message);
};

const updateCategory = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteCategory = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal de la Página ---
export const CategoriesPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => handleMutationSuccess('Categoría creada exitosamente'),
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => handleMutationSuccess('Categoría actualizada exitosamente'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => handleMutationSuccess('Categoría eliminada exitosamente'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedCategory(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (categoryData: { id?: string; name: string }) => {
    if (categoryData.id) {
      updateMutation.mutate({ id: categoryData.id, name: categoryData.name });
    } else {
      createMutation.mutate({ name: categoryData.name });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Categorías</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Categoría
        </button>
      </header>

      {isLoading && <p>Cargando categorías...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {categories && categories.length > 0 && (
        <CategoryTable categories={categories} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {categories && categories.length === 0 && <p>No se encontraron categorías.</p>}

      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        categoryToEdit={selectedCategory}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        // LA CORRECCIÓN CLAVE: Usar 'selectedCategory' en lugar de 'selectedUser'
        message={`¿Estás seguro de que quieres eliminar la categoría "${selectedCategory?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};