// File: apps/web/src/pages/routes-management/route-detail/RouteDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useRouteDetail } from './useRouteDetail';
import { useLiveCollections } from './hooks/useLiveCollections';
import { RouteHeader } from './RouteHeader';
import { RouteCollectionSummary } from './RouteCollectionSummary';
import { WaypointCollectionList } from './WaypointCollectionList';
import { EditRouteModal } from './EditRouteModal';
import styles from './RouteDetailPage.module.css';

export const RouteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { route, isLoading, error } = useRouteDetail(id!);
  const isActive = route?.status === 'in_progress';

  const {
    collections,
    tankReadings,
    isLoading: isCollectionsLoading,
    getCollectionForWaypoint,
    getReadingsForCollection,
  } = useLiveCollections(id!, isActive);

  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando ruta...</span>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className={styles.errorContainer}>
        <i className="bx bx-error-circle"></i>
        <span>Error al cargar la ruta.</span>
      </div>
    );
  }

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className={styles.pageContainer}>
        <RouteHeader route={route} onEdit={() => setIsEditOpen(true)} />

        <RouteCollectionSummary
          waypoints={route.route_waypoints}
          collections={collections}
          tankReadings={tankReadings}
        />

        {isCollectionsLoading ? (
          <div className={styles.loadingContainer}>
            <i className="bx bx-loader-alt bx-spin"></i>
            <span>Cargando datos recolectados...</span>
          </div>
        ) : (
          <WaypointCollectionList
            waypoints={route.route_waypoints}
            getCollectionForWaypoint={getCollectionForWaypoint}
            getReadingsForCollection={getReadingsForCollection}
          />
        )}

        <EditRouteModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          route={route}
        />
      </div>
    </APIProvider>
  );
};