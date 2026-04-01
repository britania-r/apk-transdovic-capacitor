// File: apps/web/src/pages/expirations/ExpirationsPage.tsx
import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import { Pagination } from '../../components/ui/Pagination';
import styles from '../users/UsersPage.module.css';
import localStyles from './ExpirationsPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';

// --- Tipos ---
interface ExpiringItem {
  item_id: number;
  purchase_order_id: string;
  order_code: string;
  purchase_type: string;
  supplier_name: string;
  vehicle_plate: string | null;
  first_aid_item_name: string | null;
  manual_code: string | null;
  details: string | null;
  expiration_date: string;
  quantity: number;
  unit_price: number;
  currency: string;
}

type ExpirationStatus = 'all' | 'expired' | 'expiring_soon' | 'valid';

// --- API ---
const fetchExpiringItems = async (): Promise<ExpiringItem[]> => {
  const { data, error } = await getSupabase().rpc('get_expiring_items');
  if (error) throw new Error(error.message);
  return data || [];
};

// --- Helpers ---
const DAYS_EXPIRING_SOON = 60;

const getExpirationStatus = (dateStr: string): { key: ExpirationStatus; label: string; className: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { key: 'expired', label: 'Vencido', className: localStyles.statusExpired };
  if (diffDays <= DAYS_EXPIRING_SOON) return { key: 'expiring_soon', label: 'Por vencer', className: localStyles.statusExpiringSoon };
  return { key: 'valid', label: 'Vigente', className: localStyles.statusValid };
};

const getDaysRemaining = (dateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} días`;
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'Vence mañana';
  return `${diffDays} días restantes`;
};

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const getItemLabel = (item: ExpiringItem): string => {
  if (item.first_aid_item_name) return item.first_aid_item_name;
  if (item.manual_code) return `Extintor: ${item.manual_code}`;
  if (item.details) return item.details;
  return item.purchase_type;
};

// --- Filter options ---
const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'SOAT', label: 'SOAT' },
  { value: 'REVISIÓN TÉCNICA', label: 'Revisión Técnica' },
  { value: 'BOTIQUÍN', label: 'Botiquín' },
  { value: 'EXTINTOR', label: 'Extintor' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'expiring_soon', label: 'Por vencer (60 días)' },
  { value: 'valid', label: 'Vigentes' },
];

const ITEMS_PER_PAGE = 50;

// --- Componente ---
export const ExpirationsPage = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['expiring_items'],
    queryFn: fetchExpiringItems,
  });

  const vehicleOptions = useMemo(() => {
    const plates = [...new Set(items.map(i => i.vehicle_plate).filter(Boolean))] as string[];
    return [{ value: '', label: 'Todos' }, ...plates.map(p => ({ value: p, label: p }))];
  }, [items]);

  const [vehicleFilter, setVehicleFilter] = useState('');

  const filtered = useMemo(() => {
    let result = items;

    if (typeFilter) result = result.filter(i => i.purchase_type === typeFilter);
    if (vehicleFilter) result = result.filter(i => i.vehicle_plate === vehicleFilter);
    if (statusFilter) result = result.filter(i => getExpirationStatus(i.expiration_date).key === statusFilter);

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(i =>
        i.order_code?.toLowerCase().includes(q) ||
        i.supplier_name?.toLowerCase().includes(q) ||
        i.vehicle_plate?.toLowerCase().includes(q) ||
        i.first_aid_item_name?.toLowerCase().includes(q) ||
        i.manual_code?.toLowerCase().includes(q) ||
        i.purchase_type?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, search, typeFilter, vehicleFilter, statusFilter]);

  const stats = useMemo(() => {
    const expired = items.filter(i => getExpirationStatus(i.expiration_date).key === 'expired').length;
    const expiringSoon = items.filter(i => getExpirationStatus(i.expiration_date).key === 'expiring_soon').length;
    const valid = items.filter(i => getExpirationStatus(i.expiration_date).key === 'valid').length;
    return { expired, expiringSoon, valid };
  }, [items]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const resetPage = () => setCurrentPage(1);
  const hasActiveFilters = !!search || !!typeFilter || !!vehicleFilter || !!statusFilter;

  const clearAllFilters = () => {
    setSearch(''); setTypeFilter(''); setVehicleFilter(''); setStatusFilter('');
    resetPage();
  };

  return (
    <div className={styles.page} ref={pageRef}>
      {/* Stats */}
      <div className={localStyles.statsRow}>
        <div className={`${localStyles.statCard} ${localStyles.statExpired}`}>
          <i className="bx bx-x-circle"></i>
          <div className={localStyles.statInfo}>
            <span className={localStyles.statNumber}>{stats.expired}</span>
            <span className={localStyles.statLabel}>Vencidos</span>
          </div>
        </div>
        <div className={`${localStyles.statCard} ${localStyles.statExpiring}`}>
          <i className="bx bx-error"></i>
          <div className={localStyles.statInfo}>
            <span className={localStyles.statNumber}>{stats.expiringSoon}</span>
            <span className={localStyles.statLabel}>Por vencer</span>
          </div>
        </div>
        <div className={`${localStyles.statCard} ${localStyles.statValid}`}>
          <i className="bx bx-check-circle"></i>
          <div className={localStyles.statInfo}>
            <span className={localStyles.statNumber}>{stats.valid}</span>
            <span className={localStyles.statLabel}>Vigentes</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Vencimientos</h1>
            <span className={styles.count}>{filtered.length}</span>
          </div>

          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar placa, proveedor, código..."
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

          <div className={localStyles.selectFilter}>
            <SimpleSelect options={TYPE_OPTIONS} value={typeFilter} onChange={v => { setTypeFilter(v); resetPage(); }} placeholder="Tipo" />
          </div>
          <div className={localStyles.selectFilter}>
            <SimpleSelect options={STATUS_OPTIONS} value={statusFilter} onChange={v => { setStatusFilter(v); resetPage(); }} placeholder="Estado" />
          </div>
          <div className={localStyles.selectFilter}>
            <SimpleSelect options={vehicleOptions} value={vehicleFilter} onChange={v => { setVehicleFilter(v); resetPage(); }} placeholder="Vehículo" />
          </div>

          {hasActiveFilters && (
            <button onClick={clearAllFilters} className={localStyles.clearBtn} title="Limpiar filtros">
              <i className="bx bx-filter-alt"></i><i className="bx bx-x"></i>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className={styles.stateBox}><i className="bx bx-loader-alt bx-spin"></i><span>Cargando vencimientos...</span></div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.stateBox}><i className="bx bx-calendar-x"></i><span>{hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay items con fecha de vencimiento'}</span></div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <div className={tableStyles.tableWrapper}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Vehículo</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => {
                  const status = getExpirationStatus(item.expiration_date);
                  return (
                    <tr key={item.item_id}>
                      <td><span className={localStyles.typeBadge}>{item.purchase_type}</span></td>
                      <td><span className={tableStyles.userName}>{getItemLabel(item)}</span></td>
                      <td className={tableStyles.monoCell}>{item.vehicle_plate || '—'}</td>
                      <td>
                        <div className={localStyles.dateCell}>
                          <span className={localStyles.dateValue}>{formatDate(item.expiration_date)}</span>
                          <span className={localStyles.daysText}>{getDaysRemaining(item.expiration_date)}</span>
                        </div>
                      </td>
                      <td><span className={`${localStyles.statusBadge} ${status.className}`}>{status.label}</span></td>
                      <td><Link to={`/purchases/${item.purchase_order_id}`} className={localStyles.orderLink}>{item.order_code}</Link></td>
                      <td>{item.supplier_name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={tableStyles.cardList}>
            {paginated.map(item => {
              const status = getExpirationStatus(item.expiration_date);
              return (
                <div key={item.item_id} className={tableStyles.card}>
                  <div className={tableStyles.cardTop}>
                    <div className={tableStyles.cardLeft}>
                      <div className={tableStyles.userInfo}>
                        <span className={tableStyles.userName}>{getItemLabel(item)}</span>
                        <span className={tableStyles.userEmail}>{item.vehicle_plate || '—'}</span>
                      </div>
                    </div>
                    <span className={`${localStyles.statusBadge} ${status.className}`}>{status.label}</span>
                  </div>
                  <div className={tableStyles.cardMeta}>
                    <div className={tableStyles.metaItem}><span className={tableStyles.metaLabel}>Tipo</span><span className={tableStyles.metaValue}>{item.purchase_type}</span></div>
                    <div className={tableStyles.metaItem}><span className={tableStyles.metaLabel}>Vencimiento</span><span className={tableStyles.metaValue}>{formatDate(item.expiration_date)}</span></div>
                    <div className={tableStyles.metaItem}><span className={tableStyles.metaLabel}>Días</span><span className={tableStyles.metaValue}>{getDaysRemaining(item.expiration_date)}</span></div>
                    <div className={tableStyles.metaItem}><span className={tableStyles.metaLabel}>Orden</span><Link to={`/purchases/${item.purchase_order_id}`} className={localStyles.orderLink}>{item.order_code}</Link></div>
                    <div className={tableStyles.metaItem}><span className={tableStyles.metaLabel}>Proveedor</span><span className={tableStyles.metaValue}>{item.supplier_name}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination currentPage={currentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} scrollRef={pageRef as React.RefObject<HTMLElement>} />
        </>
      )}
    </div>
  );
};