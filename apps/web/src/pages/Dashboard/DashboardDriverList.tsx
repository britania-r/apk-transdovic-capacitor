// File: apps/web/src/pages/dashboard/DashboardDriverList.tsx
import { DashboardDriverCard } from './DashboardDriverCard';
import type { ActiveRouteToday } from './hooks/useActiveRoutesToday';
import styles from './Dashboard.module.css';

interface Props {
  routes: ActiveRouteToday[];
  selectedRouteId: string | null;
  onSelect: (routeId: string) => void;
  getCompletedCount: (routeId: string) => number;
}

export const DashboardDriverList = ({ routes, selectedRouteId, onSelect, getCompletedCount }: Props) => {
  return (
    <div className={styles.driverList}>
      <h3 className={styles.driverListTitle}>
        <i className="bx bx-car"></i> Conductores en ruta
      </h3>

      <div className={styles.driverListItems}>
        {routes.map(route => (
          <DashboardDriverCard
            key={route.id}
            route={route}
            isSelected={route.id === selectedRouteId}
            onClick={() => onSelect(route.id)}
            completedCount={getCompletedCount(route.id)}
          />
        ))}
      </div>
    </div>
  );
};