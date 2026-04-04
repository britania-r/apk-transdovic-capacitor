// File: apps/web/src/pages/guides/GuidesPage.tsx
import { useState, useMemo } from 'react';
import { useGuidesByDate } from './hooks/useGuidesByDate';
import { GuidesRouteGroup } from './GuidesRouteGroup';
import styles from '../users/UsersPage.module.css';
import localStyles from './GuidesPage.module.css';

// Fecha de hoy en zona horaria de Perú
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const GuidesPage = () => {
  const [dateFilter, setDateFilter] = useState(getToday());
  const [search, setSearch] = useState('');

  const { data: groups = [], isLoading, error } = useGuidesByDate(dateFilter);

  // Filtrar por búsqueda
  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;

    return groups.filter(group =>
      group.sapRouteId.toLowerCase().includes(q) ||
      group.driverName.toLowerCase().includes(q) ||
      group.plate.toLowerCase().includes(q) ||
      group.entries.some(e =>
        (e.guia_transportista_number || '').toLowerCase().includes(q) ||
        (e.guia_remision_number || '').toLowerCase().includes(q) ||
        (e.waypoint?.farm?.name || '').toLowerCase().includes(q)
      )
    );
  }, [groups, search]);

  // Contar total de guías
  const totalGuides = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Guías</h1>
            <span className={styles.count}>{totalGuides}</span>
          </div>

          {/* Buscador */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por conductor, placa, SAP, nro guía..."
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
          <span>Cargando guías...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {(error as Error).message}</span>
        </div>
      )}

      {!isLoading && !error && filteredGroups.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-file"></i>
          <span>
            {search
              ? 'Sin resultados para la búsqueda'
              : 'No hay guías registradas para esta fecha'}
          </span>
        </div>
      )}

      {/* Grupos por ruta */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className={localStyles.groupsList}>
          {filteredGroups.map(group => (
            <GuidesRouteGroup key={group.routeId} group={group} />
          ))}
        </div>
      )}
    </div>
  );
};