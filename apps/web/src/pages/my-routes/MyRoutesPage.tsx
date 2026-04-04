// File: apps/web/src/pages/my-routes/MyRoutesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useProfile } from '../../hooks/useProfile';
import { MyRoutesTable } from './MyRoutesTable';
import styles from '../users/UsersPage.module.css';
import localStyles from './MyRoutesPage.module.css';

// --- Tipos ---
export interface MyRoute {
  id: string;
  route_date: string;
  status: string;
  programed_start_time: string;
  sap_route_id: string | null;
  vehicle: { plate: string } | null;
  route_waypoints: { count: number }[];
}

// Fecha de hoy en zona horaria de Perú (UTC-5)
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MyRoutesPage = () => {
  const { data: profile } = useProfile();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(getToday());

  const { data: routes = [], isLoading, error } = useQuery<MyRoute[], Error>({
    queryKey: ['myRoutes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, route_date, status, programed_start_time, sap_route_id,
          vehicle:vehicles(plate),
          route_waypoints(count)
        `)
        .eq('driver_id', profile.id)
        .order('route_date', { ascending: false })
        .returns<MyRoute[]>();
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (dateFilter) {
      result = result.filter(r => r.route_date === dateFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        (r.vehicle && r.vehicle.plate.toLowerCase().includes(q)) ||
        (r.sap_route_id && r.sap_route_id.toLowerCase().includes(q)) ||
        r.status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [routes, search, dateFilter]);

  const dayCount = dateFilter
    ? routes.filter(r => r.route_date === dateFilter).length
    : routes.length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Mis rutas</h1>
            <span className={styles.count}>{dayCount}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por placa, SAP o estado..."
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
              : 'No tienes rutas asignadas'}
          </span>
        </div>
      )}

      {!isLoading && filteredRoutes.length > 0 && (
        <MyRoutesTable routes={filteredRoutes} />
      )}
    </div>
  );
};