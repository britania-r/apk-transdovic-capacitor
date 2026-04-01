// File: apps/web/src/pages/dashboard/DashboardDriverCard.tsx
import type { ActiveRouteToday } from './hooks/useActiveRoutesToday';
import styles from './Dashboard.module.css';

interface Props {
  route: ActiveRouteToday;
  isSelected: boolean;
  onClick: () => void;
  completedCount: number;
}

export const DashboardDriverCard = ({ route, isSelected, onClick, completedCount }: Props) => {
  const driverName = route.driver
    ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
    : 'Sin conductor';

  const totalWaypoints = route.route_waypoints.length;
  const percent = totalWaypoints > 0 ? Math.round((completedCount / totalWaypoints) * 100) : 0;

  return (
    <button
      className={`${styles.driverCard} ${isSelected ? styles.driverCardSelected : ''}`}
      onClick={onClick}
    >
      <div className={styles.driverCardTop}>
        <div className={styles.driverInfo}>
          <span className={styles.driverName}>{driverName}</span>
          <span className={styles.driverMeta}>
            {route.vehicle?.plate || '—'} · {route.sap_route_id || '—'}
          </span>
        </div>
        <span className={styles.driverProgress}>{completedCount}/{totalWaypoints}</span>
      </div>

      <div className={styles.driverBarTrack}>
        <div className={styles.driverBarFill} style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
};