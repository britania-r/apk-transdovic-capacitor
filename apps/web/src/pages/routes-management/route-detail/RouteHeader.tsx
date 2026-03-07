// File: apps/web/src/pages/routes-management/route-detail/RouteHeader.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { RouteDetail } from './useRouteDetail';
import styles from './RouteDetailPage.module.css';

interface Props {
  route: RouteDetail;
  onEdit: () => void;
}

export const RouteHeader = ({ route, onEdit }: Props) => {
  const driverName = route.driver
    ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
    : 'No asignado';

  const totalLiters = route.route_waypoints.reduce(
    (sum, wp) => sum + (wp.planned_pickup_amount || 0), 0
  );

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <Link to="/routes" className={styles.backLink}>
          <i className="bx bx-arrow-back"></i> Volver
        </Link>
        <div className={styles.headerTopRight}>
          <button className={styles.editButton} onClick={onEdit}>
            <i className="bx bx-edit-alt"></i> Editar
          </button>
          <span className={`${styles.statusBadge} ${styles[route.status]}`}>
            {route.status}
          </span>
        </div>
      </div>

      <div className={styles.headerGrid}>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Fecha</span>
          <span className={styles.headerValue}>
            {format(parseISO(route.route_date), 'dd/MM/yyyy')}
          </span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Conductor</span>
          <span className={styles.headerValue}>{driverName}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Vehículo</span>
          <span className={styles.headerValue}>{route.vehicle?.plate || '-'}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Precintos</span>
          <span className={styles.headerValue}>{route.precintos_count || '-'}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Salida</span>
          <span className={styles.headerValue}>{route.programed_start_time || '-'}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Llegada</span>
          <span className={styles.headerValue}>{route.programed_arrival_time || '-'}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Paradas</span>
          <span className={styles.headerValue}>{route.route_waypoints.length}</span>
        </div>

        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Litros totales</span>
          <span className={styles.headerValue}>{totalLiters.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};