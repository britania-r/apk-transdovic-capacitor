import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { ProductTable } from './ProductTable';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
export interface ProductWithDetails {
  id: string;
  name: string;
  code: string;
  description: string | null;
  image_url: string | null;
  low_stock_threshold: number;
  created_at: string;
  category_id: string;
  subcategory_id: string | null;
  unit_id: string;
  category_name: string;
  subcategory_name: string | null;
  unit_name: string;
}

export interface Category { id: string; name: string; }
export interface Subcategory { id: string; name: string; category_id: string; }
export interface Unit { id: string; name: string; }

export type ProductFormData = Omit<ProductWithDetails, 'id' | 'created_at' | 'code' | 'category_name' | 'subcategory_name' | 'unit_name' | 'image_url'>;

// --- Funciones de API ---

const fetchProducts = async (): Promise<ProductWithDetails[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_products_with_details');
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

const fetchUnits = async (): Promise<Unit[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('units').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertProduct = async ({ id, formData, imageFile, oldImageUrl }: { id?: string; formData: ProductFormData; imageFile?: File | null; oldImageUrl?: string | null }) => {
  const supabase = getSupabase();
  let imageUrl = oldImageUrl || null;

  if (imageFile) {
    const filePath = `public/${Date.now()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);
    if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);
    
    imageUrl = supabase.storage.from('product-images').getPublicUrl(uploadData.path).data.publicUrl;

    if (oldImageUrl) {
      const oldImagePath = oldImageUrl.split('/product-images/')[1];
      await supabase.storage.from('product-images').remove([oldImagePath]);
    }
  }

  const dataToSubmit = { ...formData, image_url: imageUrl };

  if (id) {
    const { error } = await supabase.from('products').update(dataToSubmit).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('products').insert(dataToSubmit);
    if (error) throw error;
  }
};

const deleteProduct = async (product: ProductWithDetails) => {
  const supabase = getSupabase();
  if (product.image_url) {
    const imagePath = product.image_url.split('/product-images/')[1];
    await supabase.storage.from('product-images').remove([imagePath]);
  }
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
};


// --- Componente Principal ---
export const ProductsPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({ queryKey: ['subcategories'], queryFn: fetchSubcategories });
  const { data: units, isLoading: isLoadingUnits } = useQuery({ queryKey: ['units'], queryFn: fetchUnits });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['products'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: upsertProduct,
    onSuccess: (data, variables) => {
      const message = variables.id ? 'Producto actualizado' : 'Producto creado';
      handleMutationSuccess(message);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => handleMutationSuccess('Producto eliminado'),
    onError: handleMutationError,
  });
  
  const handleCloseModals = () => {
    setFormModalOpen(false);
    setConfirmModalOpen(false);
    setSelectedProduct(null);
  };
  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setFormModalOpen(true);
  };
  const handleOpenEditModal = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setFormModalOpen(true);
  };
  const handleOpenDeleteModal = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setConfirmModalOpen(true);
  };
  const handleFormSubmit = (data: { id?: string; formData: ProductFormData; imageFile?: File | null; }) => {
    upsertMutation.mutate({ ...data, oldImageUrl: selectedProduct?.image_url });
  };
  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct);
    }
  };
  
  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingSubcategories || isLoadingUnits;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Productos</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Producto
        </button>
      </header>

      {isLoading && <p>Cargando datos maestros...</p>}
      
      {products && <ProductTable products={products} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />}

      {categories && subcategories && units && (
        <ProductFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          productToEdit={selectedProduct}
          categories={categories}
          subcategories={subcategories}
          units={units}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${selectedProduct?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};