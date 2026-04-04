// File: apps/web/src/pages/dashboard/DashboardWaypointCard.tsx
import type { LiveCollection } from './hooks/useLiveCollectionsMulti';
import styles from './Dashboard.module.css';

interface Waypoint {
  id: string;
  stop_order: number;
  planned_pickup_amount: number;
  zone: string;
  farm: { id: string; name: string; ruc: string } | null;
}

interface Props {
  waypoint: Waypoint;
  collection: LiveCollection | undefined;
  onClick: () => void;
}

const STATUS_CONFIG: Record<string, { icon: string; className: string; label: string }> = {
  pending: { icon: 'bx bx-circle', className: 'statusPending', label: 'Pendiente' },
  in_progress: { icon: 'bx bx-loader-alt bx-spin', className: 'statusInProgress', label: 'En curso' },
  completed: { icon: 'bx bx-check-circle', className: 'statusCompleted', label: 'Completada' },
  skipped: { icon: 'bx bx-skip-next-circle', className: 'statusSkipped', label: 'Omitida' },
};

export const DashboardWaypointCard = ({ waypoint, collection, onClick }: Props) => {
  const status = collection?.status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const farm = waypoint.farm;

  return (
    <button className={styles.statusCard} onClick={onClick}>
      <div className={`${styles.statusDot} ${styles[config.className] || ''}`}>
        <i className={config.icon}></i>
      </div>

      <div className={styles.statusCardContent}>
        <div className={styles.statusCardHeader}>
          <span className={styles.statusCardOrder}>{waypoint.stop_order}</span>
          <span className={styles.statusCardFarm}>{farm?.name || 'Desconocida'}</span>
        </div>

        <div className={styles.statusCardMeta}>
          {collection?.guia_transportista_number && (
            <span className={styles.statusMetaItem}>
              <i className="bx bx-file"></i> GT: {collection.guia_transportista_number}
            </span>
          )}
          {collection?.precinto_ingreso && (
            <span className={styles.statusMetaItem}>
              <i className="bx bx-lock-alt"></i> {collection.precinto_ingreso}
            </span>
          )}
          {!collection && (
            <span className={styles.statusMetaItem}>
              <i className="bx bx-droplet"></i> {(waypoint.planned_pickup_amount || 0).toLocaleString()} L
            </span>
          )}
        </div>
      </div>

      <span className={`${styles.statusLabel} ${styles[config.className] || ''}`}>
        {config.label}
      </span>

      <i className="bx bx-chevron-right" style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}></i>
    </button>
  );
};