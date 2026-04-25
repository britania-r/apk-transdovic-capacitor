// File: apps/web/src/pages/inventory-outputs/InventoryOutputsPage.tsx
import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import { Pagination } from '../../components/ui/Pagination';
import { InventoryOutputsTable } from './InventoryOutputsTable';
import { InventoryOutputFormModal } from './InventoryOutputFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';
import localStyles from './InventoryOutputsPage.module.css';

// --- Tipos ---
export interface InventoryOutputInList {
  id: string;
  output_code: string;
  output_date: string;
  vehicle_plates: string;
  responsible_name: string;
  notes: string | null;
  total_items: number;
  total_quantity: number;
  created_at: string;
}

// --- API ---
const fetchOutputs = async (): Promise<InventoryOutputInList[]> => {
  const { data, error } = await getSupabase().rpc('get_inventory_outputs_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchVehicles = async () => {
  const { data, error } = await getSupabase().from('vehicles').select('id, plate').order('plate');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchUsers = async () => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, first_name')
    .order('first_name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchProducts = async () => {
  const { data, error } = await getSupabase().rpc('get_products_with_details');
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteOutput = async (id: string) => {
  const { error } = await getSupabase().from('inventory_outputs').delete().eq('id', id);
  if (error) throw error;
};

const ITEMS_PER_PAGE = 50;

// --- Componente ---
export const InventoryOutputsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageRef = useRef<HTMLDivElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<InventoryOutputInList | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: outputs = [], isLoading: loadingOutputs } = useQuery({
    queryKey: ['inventory_outputs'],
    queryFn: fetchOutputs,
  });
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users_list'],
    queryFn: fetchUsers,
  });
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const isLoading = loadingOutputs || loadingVehicles || loadingUsers || loadingProducts;

  const vehicleOptions = useMemo(() => {
    const plates = new Set<string>();
    outputs.forEach(o => {
      if (o.vehicle_plates && o.vehicle_plates !== '—') {
        o.vehicle_plates.split(', ').forEach(p => plates.add(p.trim()));
      }
    });
    return [
      { value: '', label: 'Todos' },
      ...Array.from(plates).sort().map(p => ({ value: p, label: p })),
    ];
  }, [outputs]);

  // Filtrado
  const filtered = useMemo(() => {
    let result = outputs;
    const dateField = (o: InventoryOutputInList) => o.output_date?.split('T')[0] || '';

    if (dateFrom) result = result.filter(o => dateField(o) >= dateFrom);
    if (dateTo) result = result.filter(o => dateField(o) <= dateTo);
    if (vehicleFilter) result = result.filter(o => o.vehicle_plates?.includes(vehicleFilter));

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(o =>
        o.output_code?.toLowerCase().includes(q) ||
        o.vehicle_plates?.toLowerCase().includes(q) ||
        o.responsible_name?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [outputs, search, dateFrom, dateTo, vehicleFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const resetPage = () => setCurrentPage(1);
  const hasActiveFilters = !!search || !!dateFrom || !!dateTo || !!vehicleFilter;

  const clearAllFilters = () => {
    setSearch(''); setDateFrom(''); setDateTo(''); setVehicleFilter('');
    resetPage();
  };

  const deleteMutation = useMutation({
    mutationFn: deleteOutput,
    onSuccess: () => {
      toast.success('Salida eliminada');
      queryClient.invalidateQueries({ queryKey: ['inventory_outputs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteOpen(false);
      setSelectedOutput(null);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleFormSuccess = (outputId: string) => {
    queryClient.invalidateQueries({ queryKey: ['inventory_outputs'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setIsFormOpen(false);
    navigate(`/salidas/${outputId}`);
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Salidas de inventario</h1>
            <span className={styles.count}>{filtered.length}</span>
          </div>

          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar código, placa, responsable..."
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => { setSearch(''); resetPage(); }}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }} className={localStyles.dateInput} title="Desde" />
          </div>

          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar-check"></i>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); resetPage(); }} className={localStyles.dateInput} title="Hasta" />
          </div>

          <div className={localStyles.selectFilter}>
            <SimpleSelect options={vehicleOptions} value={vehicleFilter} onChange={v => { setVehicleFilter(v); resetPage(); }} placeholder="Vehículo" />
          </div>

          {hasActiveFilters && (
            <button onClick={clearAllFilters} className={localStyles.clearBtn} title="Limpiar filtros">
              <i className="bx bx-filter-alt"></i><i className="bx bx-x"></i>
            </button>
          )}

          <button onClick={() => setIsFormOpen(true)} className={styles.addBtn} disabled={isLoading}>
            <i className="bx bx-plus"></i>
            <span>Nueva salida</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.stateBox}><i className="bx bx-loader-alt bx-spin"></i><span>Cargando salidas...</span></div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.stateBox}><i className="bx bx-export"></i><span>{hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay salidas registradas'}</span></div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <InventoryOutputsTable
            outputs={paginated}
            onDelete={o => { setSelectedOutput(o); setIsDeleteOpen(true); }}
          />
          <Pagination currentPage={currentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} scrollRef={pageRef as React.RefObject<HTMLElement>} />
        </>
      )}

      {isFormOpen && (
        <InventoryOutputFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          vehicles={vehicles}
          users={users}
          products={products}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedOutput(null); }}
        onConfirm={() => selectedOutput && deleteMutation.mutate(selectedOutput.id)}
        title="Eliminar salida"
        message={`¿Eliminar la salida ${selectedOutput?.output_code}? El stock de los productos se devolverá al inventario.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};