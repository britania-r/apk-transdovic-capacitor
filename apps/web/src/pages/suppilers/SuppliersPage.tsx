import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { SupplierTable } from './SupplierTable';
import { SupplierFormModal } from './SupplierFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { City } from '../settings/CitiesPage';
import type { Category } from '../settings/CategoriesPage';
import styles from '../users/UsersPage.module.css';

// --- Tipos y Funciones de API ---
export interface SupplierInList {
  id: string;
  trade_name: string;
  legal_name: string;
  ruc: string;
  address: string | null;
  description: string | null;
  city_id: string | null;
  category_id: string | null;
  city_name: string | null;
  category_name: string | null;
}

const fetchSuppliers = async (): Promise<SupplierInList[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_suppliers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCities = async (): Promise<City[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('cities').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertSupplier = async (supplierData: { id?: string } & Omit<SupplierInList, 'id' | 'city_name' | 'category_name'>) => {
  const supabase = getSupabase();
  const { id, ...dataToUpsert } = supplierData;

  if (id) {
    const { error } = await supabase.from('suppliers').update(dataToUpsert).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('suppliers').insert(dataToUpsert);
    if (error) throw error;
  }
};

const deleteSupplier = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal ---
export const SuppliersPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInList | null>(null);
  
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const { data: cities, isLoading: isLoadingCities } = useQuery({ queryKey: ['cities'], queryFn: fetchCities });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: upsertSupplier,
    onSuccess: (data, variables) => {
      const message = variables.id ? 'Proveedor actualizado' : 'Proveedor creado';
      handleMutationSuccess(message);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => handleMutationSuccess('Proveedor eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setSelectedSupplier(null); setFormModalOpen(false); setConfirmModalOpen(false); };
  const handleOpenCreateModal = () => { setSelectedSupplier(null); setFormModalOpen(true); };
  const handleOpenEditModal = (supplier: SupplierInList) => { setSelectedSupplier(supplier); setFormModalOpen(true); };
  const handleOpenDeleteModal = (supplier: SupplierInList) => { setSelectedSupplier(supplier); setConfirmModalOpen(true); };

  const handleFormSubmit = (data) => {
    upsertMutation.mutate(data);
  };

  const handleDeleteConfirm = () => { if (selectedSupplier) { deleteMutation.mutate(selectedSupplier.id); } };
  
  const isLoading = isLoadingSuppliers || isLoadingCities || isLoadingCategories;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Proveedores</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Proveedor
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {suppliers && <SupplierTable suppliers={suppliers} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}

      {cities && categories && (
        <SupplierFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          supplierToEdit={selectedSupplier}
          cities={cities}
          categories={categories}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar al proveedor "${selectedSupplier?.trade_name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};