// File: apps/web/src/pages/routes-management/RoutesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupabase } from '@transdovic/shared';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { APIProvider } from '@vis.gl/react-google-maps';

import { RoutesTable } from './RoutesTable';
import { ImportRoutesModal } from './ImportRoutesModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';
import localStyles from './RoutesPage.module.css';

// --- Tipos ---
export interface Route {
  id: string;
  route_date: string;
  status: string;
  programed_start_time: string;
  sap_route_id: string | null;
  driver: { first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: { count: number }[];
}

// --- API ---
const fetchRoutes = async (): Promise<Route[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('routes')
    .select(`
      id, route_date, status, programed_start_time, sap_route_id,
      driver:profiles(first_name, paternal_last_name),
      vehicle:vehicles(plate),
      route_waypoints(count)
    `)
    .order('route_date', { ascending: false })
    .returns<Route[]>();
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteRoute = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// Fecha de hoy en zona horaria de Perú (UTC-5)
const getTodayPeru = () => {
  const now = new Date();
  const peruOffset = -5 * 60;
  const localOffset = now.getTimezoneOffset();
  const peruTime = new Date(now.getTime() + (localOffset + peruOffset) * 60000);
  return peruTime.toISOString().split('T')[0];
};

// --- Componente interno ---
const RoutesPageContent = () => {
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(getTodayPeru());

  const queryClient = useQueryClient();

  const { data: routes = [], isLoading, error } = useQuery<Route[], Error>({
    queryKey: ['savedRoutes'],
    queryFn: fetchRoutes,
  });

  const filteredRoutes = useMemo(() => {
    let result = routes;

    // Filtro por fecha
    if (dateFilter) {
      result = result.filter(r => r.route_date === dateFilter);
    }

    // Filtro por búsqueda
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        (r.driver && `${r.driver.first_name} ${r.driver.paternal_last_name}`.toLowerCase().includes(q)) ||
        (r.vehicle && r.vehicle.plate.toLowerCase().includes(q)) ||
        (r.sap_route_id && r.sap_route_id.toLowerCase().includes(q)) ||
        r.status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [routes, search, dateFilter]);

  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      toast.success('Ruta eliminada');
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      setRouteToDelete(null);
      setConfirmModalOpen(false);
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleDeleteRequest = (routeId: string) => {
    setRouteToDelete(routeId);
    setConfirmModalOpen(true);
  };

  // Contar rutas del día seleccionado
  const dayCount = dateFilter
    ? routes.filter(r => r.route_date === dateFilter).length
    : routes.length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Rutas</h1>
            <span className={styles.count}>{dayCount}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por conductor, placa, SAP o estado..."
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

          {/* Filtro de fecha */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className={localStyles.dateInput}
            />
            {dateFilter && (
              <button
                className={localStyles.dateClear}
                onClick={() => setDateFilter('')}
                title="Ver todas las fechas"
              >
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          {/* Botón importar */}
          <button
            onClick={() => setImportModalOpen(true)}
            className={styles.addBtn}
          >
            <i className="bx bxs-file-import"></i>
            <span>Importar Excel</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando rutas...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredRoutes.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-map-alt"></i>
          <span>
            {search || dateFilter
              ? 'Sin resultados para los filtros aplicados'
              : 'No hay rutas registradas'}
          </span>
        </div>
      )}

      {!isLoading && filteredRoutes.length > 0 && (
        <RoutesTable
          routes={filteredRoutes}
          onDelete={handleDeleteRequest}
        />
      )}

      <ImportRoutesModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRouteToDelete(null); }}
        onConfirm={() => routeToDelete && deleteMutation.mutate(routeToDelete)}
        title="Eliminar ruta"
        message="¿Estás seguro de eliminar esta ruta? Esta acción es irreversible."
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export const RoutesPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <RoutesPageContent />
  </APIProvider>
);