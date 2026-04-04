// File: apps/web/src/pages/dashboard/DashboardRouteDetail.tsx
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DashboardWaypointCard } from './DashboardWaypointCard';
import { CollectionDetailModal } from './CollectionDetailModal';
import type { ActiveRouteToday } from './hooks/useActiveRoutesToday';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollectionsMulti';
import styles from './Dashboard.module.css';

interface Props {
  route: ActiveRouteToday;
  getCollectionForWaypoint: (waypointId: string) => LiveCollection | undefined;
  getReadingsForCollection: (collectionId: string) => LiveTankReading[];
  getCompletedCount: (routeId: string) => number;
  onGuiaUploaded: () => void;
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'HH:mm');
  } catch {
    return '—';
  }
};

export const DashboardRouteDetail = ({ route, getCollectionForWaypoint, getReadingsForCollection, getCompletedCount, onGuiaUploaded }: Props) => {
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);

  const driverName = route.driver
    ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
    : 'Sin conductor';

  const completedCount = getCompletedCount(route.id);
  const totalWaypoints = route.route_waypoints.length;
  const totalLiters = route.route_waypoints.reduce(
    (sum, wp) => sum + (wp.planned_pickup_amount || 0), 0
  );

  // Para el modal de detalle
  const selectedWaypoint = route.route_waypoints.find(wp => wp.id === selectedWaypointId);
  const selectedCollection = selectedWaypointId ? getCollectionForWaypoint(selectedWaypointId) : undefined;
  const selectedReadings = selectedCollection ? getReadingsForCollection(selectedCollection.id) : [];

  return (
    <>
      <div className={styles.routeDetail}>
        {/* Info rápida */}
        <div className={styles.routeDetailHeader}>
          <h3 className={styles.routeDetailTitle}>
            {route.sap_route_id || 'Ruta'} — {route.vehicle?.plate || '—'}
          </h3>
          <span className={styles.routeDetailSub}>{driverName}</span>
        </div>

        <div className={styles.routeDetailGrid}>
          <div className={styles.routeDetailItem}>
            <span className={styles.routeDetailLabel}>Salida prog.</span>
            <span className={styles.routeDetailValue}>{route.programed_start_time || '—'}</span>
          </div>
          <div className={styles.routeDetailItem}>
            <span className={styles.routeDetailLabel}>Inicio real</span>
            <span className={styles.routeDetailValue}>{formatTime(route.started_at)}</span>
          </div>
          <div className={styles.routeDetailItem}>
            <span className={styles.routeDetailLabel}>Progreso</span>
            <span className={styles.routeDetailValue}>{completedCount}/{totalWaypoints}</span>
          </div>
          <div className={styles.routeDetailItem}>
            <span className={styles.routeDetailLabel}>Litros plan.</span>
            <span className={styles.routeDetailValue}>{totalLiters.toLocaleString()}</span>
          </div>
        </div>

        {/* Lista de waypoints */}
        <div className={styles.routeDetailWaypoints}>
          <h4 className={styles.routeDetailWaypointsTitle}>Paradas</h4>
          {route.route_waypoints.map(wp => {
            const collection = getCollectionForWaypoint(wp.id);
            return (
              <DashboardWaypointCard
                key={wp.id}
                waypoint={wp}
                collection={collection}
                onClick={() => setSelectedWaypointId(wp.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Modal de detalle con upload de guías */}
      <CollectionDetailModal
        isOpen={!!selectedWaypointId}
        onClose={() => setSelectedWaypointId(null)}
        waypoint={selectedWaypoint || null}
        collection={selectedCollection}
        readings={selectedReadings}
        routeId={route.id}
        onGuiaUploaded={onGuiaUploaded}
      />
    </>
  );
};