// File: apps/web/src/pages/purchases/PurchasesPage.tsx
import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import { Pagination } from '../../components/ui/Pagination';
import { PurchaseOrdersTable } from './PurchaseOrdersTable';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { SupplierInList } from '../suppilers/SuppliersPage';
import type { NewPurchaseOrderData } from './PurchaseOrderFormModal';
import styles from '../users/UsersPage.module.css';
import localStyles from './PurchasesPage.module.css';

// --- Tipos ---
export interface PurchaseOrderInList {
  id: string;
  order_code: string;
  order_date: string;
  status: string;
  total_amount: number;
  supplier_name: string;
  invoice_number: string | null;
  currency: string;
}

// --- Funciones de API ---
const fetchPurchaseOrders = async (): Promise<PurchaseOrderInList[]> => {
  const { data, error } = await getSupabase().rpc('get_purchase_orders_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchSuppliers = async (): Promise<SupplierInList[]> => {
  const { data, error } = await getSupabase().rpc('get_suppliers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const createPurchaseOrder = async (data: NewPurchaseOrderData): Promise<{ id: string }> => {
  const { data: newOrder, error } = await getSupabase()
    .from('purchase_orders')
    .insert([data])
    .select('id')
    .single();
  if (error) throw error;
  return newOrder;
};

const deletePurchaseOrder = async (id: string) => {
  const { error } = await getSupabase().from('purchase_orders').delete().eq('id', id);
  if (error) throw error;
};

// --- Opciones de filtro ---
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'REQUERIMIENTO', label: 'Requerimiento' },
  { value: 'COTIZACIÓN', label: 'Cotización' },
  { value: 'ORDEN DE COMPRA', label: 'Orden de Compra' },
  { value: 'ORDEN DE SERVICIO', label: 'Orden de Servicio' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'AC INCONFORME', label: 'AC Inconforme' },
  { value: 'ACTA DE CONFORMIDAD', label: 'Acta de Conformidad' },
  { value: 'PAGO PENDIENTE', label: 'Pago Pendiente' },
  { value: 'FACTURA PAGADA', label: 'Factura Pagada' },
];

const CURRENCY_FILTER_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const ITEMS_PER_PAGE = 50;

// --- Componente Principal ---
export const PurchasesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageRef = useRef<HTMLDivElement>(null);

  // Estado UI
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderInList | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: fetchPurchaseOrders,
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });

  const isLoading = loadingOrders || loadingSuppliers;

  // Opciones de proveedores para el filtro
  const supplierOptions = useMemo(() => {
    const uniqueNames = [...new Set(orders.map(o => o.supplier_name).filter(Boolean))];
    return [
      { value: '', label: 'Todos' },
      ...uniqueNames.map(name => ({ value: name, label: name })),
    ];
  }, [orders]);

  // Filtrado
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (dateFrom) {
      result = result.filter(o => o.order_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(o => o.order_date <= dateTo);
    }
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }
    if (currencyFilter) {
      result = result.filter(o => o.currency === currencyFilter);
    }
    if (supplierFilter) {
      result = result.filter(o => o.supplier_name === supplierFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(o =>
        o.order_code?.toLowerCase().includes(q) ||
        o.supplier_name?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q) ||
        o.invoice_number?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, search, dateFrom, dateTo, statusFilter, currencyFilter, supplierFilter]);

  // Paginación
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset página al cambiar filtros
  const resetPage = () => setCurrentPage(1);

  const handleSearchChange = (value: string) => { setSearch(value); resetPage(); };
  const handleDateFromChange = (value: string) => { setDateFrom(value); resetPage(); };
  const handleDateToChange = (value: string) => { setDateTo(value); resetPage(); };
  const handleStatusChange = (value: string) => { setStatusFilter(value); resetPage(); };
  const handleCurrencyChange = (value: string) => { setCurrencyFilter(value); resetPage(); };
  const handleSupplierChange = (value: string) => { setSupplierFilter(value); resetPage(); };

  const hasActiveFilters = !!search || !!dateFrom || !!dateTo || !!statusFilter || !!currencyFilter || !!supplierFilter;

  const clearAllFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setCurrencyFilter('');
    setSupplierFilter('');
    resetPage();
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (newOrder) => {
      toast.success('Proceso de compra iniciado');
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      setIsFormOpen(false);
      navigate(`/purchases/${newOrder.id}`);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      toast.success('Orden eliminada');
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      setIsDeleteOpen(false);
      setSelectedOrder(null);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleCloseModals = () => {
    setSelectedOrder(null);
    setIsFormOpen(false);
    setIsDeleteOpen(false);
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Registro de Compras</h1>
            <span className={styles.count}>{filteredOrders.length}</span>
          </div>

          {/* Buscador */}
          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar código, proveedor, factura..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => handleSearchChange('')}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          {/* Filtro fecha desde */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFrom}
              onChange={e => handleDateFromChange(e.target.value)}
              className={localStyles.dateInput}
              title="Desde"
            />
          </div>

          {/* Filtro fecha hasta */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar-check"></i>
            <input
              type="date"
              value={dateTo}
              onChange={e => handleDateToChange(e.target.value)}
              className={localStyles.dateInput}
              title="Hasta"
            />
          </div>

          {/* Filtro estado */}
          <div className={localStyles.selectFilter}>
            <SimpleSelect
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={handleStatusChange}
              placeholder="Estado"
            />
          </div>

          {/* Filtro moneda */}
          <div className={localStyles.selectFilter}>
            <SimpleSelect
              options={CURRENCY_FILTER_OPTIONS}
              value={currencyFilter}
              onChange={handleCurrencyChange}
              placeholder="Moneda"
            />
          </div>

          {/* Filtro proveedor */}
          <div className={localStyles.selectFilterWide}>
            <SimpleSelect
              options={supplierOptions}
              value={supplierFilter}
              onChange={handleSupplierChange}
              placeholder="Proveedor"
            />
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={localStyles.clearBtn}
              title="Limpiar filtros"
            >
              <i className="bx bx-filter-alt"></i>
              <i className="bx bx-x"></i>
            </button>
          )}

          {/* Botón nueva orden */}
          <button
            onClick={() => { setSelectedOrder(null); setIsFormOpen(true); }}
            className={styles.addBtn}
            disabled={isLoading}
          >
            <i className="bx bx-plus"></i>
            <span>Nueva orden</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando órdenes de compra...</span>
        </div>
      )}

      {!isLoading && filteredOrders.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-cart"></i>
          <span>{hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay órdenes de compra registradas'}</span>
        </div>
      )}

      {!isLoading && filteredOrders.length > 0 && (
        <>
          <PurchaseOrdersTable
            orders={paginatedOrders}
            onDelete={order => { setSelectedOrder(order); setIsDeleteOpen(true); }}
          />

          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            scrollRef={pageRef as React.RefObject<HTMLElement>}
          />
        </>
      )}

      {/* Modal crear orden */}
      {suppliers.length > 0 && isFormOpen && (
        <PurchaseOrderFormModal
          isOpen={isFormOpen}
          onClose={handleCloseModals}
          onSubmit={data => createMutation.mutate(data)}
          suppliers={suppliers}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Modal confirmar eliminación */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedOrder && deleteMutation.mutate(selectedOrder.id, { onSuccess: () => { setIsDeleteOpen(false); setSelectedOrder(null); } })}
        title="Eliminar orden de compra"
        message={`¿Estás seguro de eliminar la orden ${selectedOrder?.order_code}? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};