// File: apps/web/src/pages/fuel-vouchers/ValesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useFuelVouchers, type FuelVoucher } from './hooks/useFuelVouchers';
import { ValesTable } from './ValesTable';
import { ValeFormModal } from './ValeFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';
import localStyles from '../operations/OperationsPage.module.css';

interface Vehicle {
  id: string;
  plate: string;
}

const fetchVehicles = async (): Promise<Vehicle[]> => {
  const { data, error } = await getSupabase()
    .from('vehicles')
    .select('id, plate')
    .order('plate');
  if (error) throw new Error(error.message);
  return data || [];
};

export const ValesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVale, setSelectedVale] = useState<FuelVoucher | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { vouchers, isLoading: loadingVouchers, saveMutation, deleteMutation } = useFuelVouchers();

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles_list'],
    queryFn: fetchVehicles,
  });

  const isLoading = loadingVouchers || loadingVehicles;

  const filtered = useMemo(() => {
    let result = vouchers;

    if (dateFrom) result = result.filter(v => v.voucher_date >= dateFrom);
    if (dateTo) result = result.filter(v => v.voucher_date <= dateTo);

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(v =>
        v.plate.toLowerCase().includes(q) ||
        (v.dispatch_note && v.dispatch_note.toLowerCase().includes(q)) ||
        (v.invoice && v.invoice.toLowerCase().includes(q)) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [vouchers, search, dateFrom, dateTo]);

  const handleCloseModals = () => {
    setSelectedVale(null);
    setIsFormOpen(false);
    setIsDeleteOpen(false);
  };

  const handleFormSubmit = (payload: any) => {
    saveMutation.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
  };

  const hasActiveFilters = !!dateFrom || !!dateTo || !!search;

  const clearAllFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Vales de combustible</h1>
            <span className={styles.count}>{filtered.length}</span>
          </div>

          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por placa, despacho, factura..."
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

          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={localStyles.dateInput}
              title="Desde"
            />
          </div>

          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar-check"></i>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={localStyles.dateInput}
              title="Hasta"
            />
          </div>

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

          <button
            onClick={() => { setSelectedVale(null); setIsFormOpen(true); }}
            className={styles.addBtn}
            disabled={isLoading}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo vale</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando vales...</span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-gas-pump"></i>
          <span>{hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay vales registrados'}</span>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ValesTable
          vouchers={filtered}
          onEdit={v => { setSelectedVale(v); setIsFormOpen(true); }}
          onDelete={v => { setSelectedVale(v); setIsDeleteOpen(true); }}
        />
      )}

      {vehicles.length > 0 && isFormOpen && (
        <ValeFormModal
          isOpen={isFormOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          valeToEdit={selectedVale}
          vehicles={vehicles}
          isLoading={saveMutation.isPending}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedVale && deleteMutation.mutate(selectedVale.id, { onSuccess: () => setIsDeleteOpen(false) })}
        title="Eliminar vale"
        message={`¿Estás seguro de eliminar este vale (${selectedVale?.plate} - ${selectedVale?.voucher_date})? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};