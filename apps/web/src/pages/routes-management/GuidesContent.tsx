// File: apps/web/src/pages/routes-management/GuidesContent.tsx
import { useMemo, useEffect } from 'react';
import { useGuidesByDate } from '../guides/hooks/useGuidesByDate';
import { GuidesRouteGroup } from '../guides/GuidesRouteGroup';
import styles from '../users/UsersPage.module.css';
import localStyles from '../guides/GuidesPage.module.css';

interface GuidesContentProps {
  dateFilter: string;
  search: string;
  onCountChange: (count: number) => void;
}

export const GuidesContent = ({ dateFilter, search, onCountChange }: GuidesContentProps) => {
  const { data: groups = [], isLoading, error } = useGuidesByDate(dateFilter);

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

  const totalGuides = filteredGroups.reduce((sum, g) => sum + g.entries.length, 0);

  // Sincronizar contador
  useEffect(() => {
    onCountChange(totalGuides);
  }, [totalGuides, onCountChange]);

  return (
    <>
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

      {!isLoading && filteredGroups.length > 0 && (
        <div className={localStyles.groupsList}>
          {filteredGroups.map(group => (
            <GuidesRouteGroup key={group.routeId} group={group} />
          ))}
        </div>
      )}
    </>
  );
};