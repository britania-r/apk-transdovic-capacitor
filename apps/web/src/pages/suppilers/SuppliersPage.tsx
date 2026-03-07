// File: apps/web/src/pages/suppliers/SuppliersPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SupplierTable } from './SupplierTable';
import { SupplierFormModal } from './SupplierFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { City } from '../settings/CitiesPage';
import type { Category } from '../settings/CategoriesPage';
import styles from '../users/UsersPage.module.css';

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

// ── API ────────────────────────────────────────────────────────────────────

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

// ── Componente ─────────────────────────────────────────────────────────────

export const SuppliersPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInList | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({ queryKey: ['cities'], queryFn: fetchCities });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const isLoading = isLoadingSuppliers || isLoadingCities || isLoadingCategories;

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      s.trade_name.toLowerCase().includes(q) ||
      s.legal_name.toLowerCase().includes(q) ||
      s.ruc.includes(q) ||
      (s.city_name ?? '').toLowerCase().includes(q) ||
      (s.category_name ?? '').toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const handleCloseModals = () => {
    setSelectedSupplier(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const upsertMutation = useMutation({
    mutationFn: upsertSupplier,
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Proveedor actualizado' : 'Proveedor creado');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success('Proveedor eliminado');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Proveedores</h1>
            <span className={styles.count}>{suppliers.length}</span>
          </div>

          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, RUC, ciudad o categoría..."
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
            onClick={() => { setSelectedSupplier(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo proveedor</span>
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando proveedores...</span>
        </div>
      )}

      {!isLoading && filteredSuppliers.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-store"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay proveedores registrados'}</span>
        </div>
      )}

      {!isLoading && filteredSuppliers.length > 0 && (
        <SupplierTable
          suppliers={filteredSuppliers}
          onEdit={s => { setSelectedSupplier(s); setFormModalOpen(true); }}
          onDelete={s => { setSelectedSupplier(s); setConfirmModalOpen(true); }}
        />
      )}

      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={data => upsertMutation.mutate(data)}
        supplierToEdit={selectedSupplier}
        cities={cities}
        categories={categories}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedSupplier && deleteMutation.mutate(selectedSupplier.id)}
        title="Eliminar proveedor"
        message={`¿Estás seguro de eliminar a "${selectedSupplier?.trade_name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};