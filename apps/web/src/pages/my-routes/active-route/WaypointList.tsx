// File: apps/web/src/pages/my-routes/active-route/WaypointList.tsx
import type { ActiveWaypoint } from './hooks/useActiveRoute';
import type { WaypointCollection } from './hooks/useWaypointCollection';
import { WaypointCard } from './WaypointCard';
import styles from './ActiveRoutePage.module.css';

interface Props {
  waypoints: ActiveWaypoint[];
  collections: Pick<WaypointCollection, 'id' | 'waypoint_id' | 'status'>[];
  routeId: string;
  isRouteActive: boolean;
}

export const WaypointList = ({ waypoints, collections, routeId, isRouteActive }: Props) => {
  // Map de estado por waypoint_id
  const statusMap = new Map(
    collections.map(c => [c.waypoint_id, c.status])
  );

  return (
    <div className={styles.waypointSection}>
      <h2 className={styles.waypointSectionTitle}>
        <i className="bx bx-map-pin"></i> Paradas
      </h2>

      <div className={styles.waypointList}>
        {waypoints.map((wp, index) => (
          <WaypointCard
            key={wp.id}
            waypoint={wp}
            index={index}
            status={statusMap.get(wp.id) || 'pending'}
            routeId={routeId}
            isRouteActive={isRouteActive}
            isFirst={index === 0}
            isLast={index === waypoints.length - 1}
          />
        ))}
      </div>
    </div>
  );
};