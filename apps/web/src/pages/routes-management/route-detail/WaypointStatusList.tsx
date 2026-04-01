// File: apps/web/src/pages/routes-management/route-detail/WaypointStatusList.tsx
import { useState } from 'react';
import { WaypointStatusCard } from './WaypointStatusCard';
import { CollectionDetailModal } from './CollectionDetailModal';
import type { WaypointDetail } from './useRouteDetail';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollections';
import styles from './LiveTracking.module.css';

interface Props {
  waypoints: WaypointDetail[];
  getCollectionForWaypoint: (waypointId: string) => LiveCollection | undefined;
  getReadingsForCollection: (collectionId: string) => LiveTankReading[];
}

export const WaypointStatusList = ({ waypoints, getCollectionForWaypoint, getReadingsForCollection }: Props) => {
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);

  const selectedWaypoint = waypoints.find(wp => wp.id === selectedWaypointId);
  const selectedCollection = selectedWaypointId ? getCollectionForWaypoint(selectedWaypointId) : undefined;
  const selectedReadings = selectedCollection ? getReadingsForCollection(selectedCollection.id) : [];

  return (
    <>
      <div className={styles.statusSection}>
        <h3 className={styles.statusTitle}>
          <i className="bx bx-map-pin"></i> Estado de paradas
        </h3>

        <div className={styles.statusList}>
          {waypoints.map(wp => {
            const collection = getCollectionForWaypoint(wp.id);
            return (
              <WaypointStatusCard
                key={wp.id}
                waypoint={wp}
                collection={collection}
                onClick={() => setSelectedWaypointId(wp.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Modal de detalle */}
      <CollectionDetailModal
        isOpen={!!selectedWaypointId}
        onClose={() => setSelectedWaypointId(null)}
        waypoint={selectedWaypoint}
        collection={selectedCollection}
        readings={selectedReadings}
      />
    </>
  );
};