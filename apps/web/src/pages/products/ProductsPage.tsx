// File: apps/web/src/pages/products/ProductsPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ProductTable } from './ProductTable';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// ── Tipos ──────────────────────────────────────────────────────────────────

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

export type ProductFormData = Omit<ProductWithDetails,
  'id' | 'created_at' | 'code' | 'category_name' | 'subcategory_name' | 'unit_name' | 'image_url'
>;

// ── API ────────────────────────────────────────────────────────────────────

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

const upsertProduct = async ({
  id, formData, imageFile, oldImageUrl,
}: {
  id?: string;
  formData: ProductFormData;
  imageFile?: File | null;
  oldImageUrl?: string | null;
}) => {
  const supabase = getSupabase();
  let imageUrl = oldImageUrl || null;

  if (imageFile) {
    const filePath = `public/${Date.now()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images').upload(filePath, imageFile);
    if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);
    imageUrl = supabase.storage.from('product-images').getPublicUrl(uploadData.path).data.publicUrl;
    if (oldImageUrl) {
      const oldPath = oldImageUrl.split('/product-images/')[1];
      await supabase.storage.from('product-images').remove([oldPath]);
    }
  }

  const payload = { ...formData, image_url: imageUrl };
  if (id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('products').insert(payload);
    if (error) throw error;
  }
};

const deleteProduct = async (product: ProductWithDetails) => {
  const supabase = getSupabase();
  if (product.image_url) {
    const path = product.image_url.split('/product-images/')[1];
    await supabase.storage.from('product-images').remove([path]);
  }
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
};

// ── Componente ─────────────────────────────────────────────────────────────

export const ProductsPage = () => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<ProductWithDetails | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery({ queryKey: ['subcategories'], queryFn: fetchSubcategories });
  const { data: units = [], isLoading: isLoadingUnits } = useQuery({ queryKey: ['units'], queryFn: fetchUnits });

  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingSubcategories || isLoadingUnits;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category_name.toLowerCase().includes(q) ||
      (p.subcategory_name ?? '').toLowerCase().includes(q) ||
      p.unit_name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const close = () => { setFormOpen(false); setConfirmOpen(false); setSelected(null); };

  const upsertMutation = useMutation({
    mutationFn: upsertProduct,
    onSuccess: (_, v) => {
      toast.success(v.id ? 'Producto actualizado' : 'Producto creado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      close();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      close();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Productos</h1>
            <span className={styles.count}>{products.length}</span>
          </div>

          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, código, categoría..."
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

          <button onClick={() => { setSelected(null); setFormOpen(true); }} className={styles.addBtn}>
            <i className="bx bx-plus"></i>
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando productos...</span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-package"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay productos registrados'}</span>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ProductTable
          products={filtered}
          onEdit={p => { setSelected(p); setFormOpen(true); }}
          onDelete={p => { setSelected(p); setConfirmOpen(true); }}
        />
      )}

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={close}
        onSubmit={data => upsertMutation.mutate({ ...data, oldImageUrl: selected?.image_url })}
        productToEdit={selected}
        categories={categories}
        subcategories={subcategories}
        units={units}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={close}
        onConfirm={() => selected && deleteMutation.mutate(selected)}
        title="Eliminar producto"
        message={`¿Eliminar "${selected?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};