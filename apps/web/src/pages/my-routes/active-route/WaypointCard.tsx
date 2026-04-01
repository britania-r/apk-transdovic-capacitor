// File: apps/web/src/pages/my-routes/active-route/WaypointCard.tsx
import { Link } from 'react-router-dom';
import type { ActiveWaypoint } from './hooks/useActiveRoute';
import styles from './ActiveRoutePage.module.css';

interface Props {
  waypoint: ActiveWaypoint;
  index: number;
  status: string;
  routeId: string;
  isRouteActive: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const STATUS_CONFIG: Record<string, { icon: string; className: string; label: string }> = {
  pending: {
    icon: 'bx bx-circle',
    className: 'wpPending',
    label: 'Pendiente',
  },
  in_progress: {
    icon: 'bx bx-loader-alt bx-spin',
    className: 'wpInProgress',
    label: 'En curso',
  },
  completed: {
    icon: 'bx bx-check-circle',
    className: 'wpCompleted',
    label: 'Completada',
  },
  skipped: {
    icon: 'bx bx-skip-next-circle',
    className: 'wpSkipped',
    label: 'Omitida',
  },
};

export const WaypointCard = ({ waypoint, index, status, routeId, isRouteActive, isFirst, isLast }: Props) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const farm = waypoint.farm;
  const canNavigate = isRouteActive || status === 'completed';

  const cardContent = (
    <div className={`${styles.wpCard} ${styles[config.className] || ''}`}>
      {/* Timeline */}
      <div className={styles.wpTimeline}>
        {!isFirst && <div className={`${styles.wpTimelineLine} ${styles.wpTimelineLineTop}`} />}
        <div className={`${styles.wpTimelineDot} ${styles[config.className] || ''}`}>
          <i className={config.icon}></i>
        </div>
        {!isLast && <div className={`${styles.wpTimelineLine} ${styles.wpTimelineLineBottom}`} />}
      </div>

      {/* Contenido */}
      <div className={styles.wpContent}>
        <div className={styles.wpHeader}>
          <span className={styles.wpOrder}>{index + 1}</span>
          <span className={styles.wpFarmName}>{farm?.name || 'Granja desconocida'}</span>
          {canNavigate && (
            <i className="bx bx-chevron-right" style={{ color: 'var(--color-text-muted)' }}></i>
          )}
        </div>

        <div className={styles.wpMeta}>
          {farm?.ruc && (
            <span className={styles.wpMetaItem}>
              <i className="bx bx-id-card"></i> {farm.ruc}
            </span>
          )}
          {waypoint.zone && (
            <span className={styles.wpMetaItem}>
              <i className="bx bx-map"></i> {waypoint.zone}
            </span>
          )}
          {waypoint.planned_pickup_amount > 0 && (
            <span className={styles.wpMetaItem}>
              <i className="bx bx-droplet"></i> {waypoint.planned_pickup_amount.toLocaleString()} L
            </span>
          )}
        </div>

        <span className={`${styles.wpStatusLabel} ${styles[config.className] || ''}`}>
          {config.label}
        </span>
      </div>
    </div>
  );

  if (canNavigate) {
    return (
      <Link
        to={`/mis-rutas/${routeId}/parada/${waypoint.id}`}
        className={styles.wpCardLink}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};