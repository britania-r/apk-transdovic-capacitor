// File: apps/web/src/pages/routes-management/route-detail/RouteDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useRouteDetail } from './useRouteDetail';
import { RouteHeader } from './RouteHeader';
import { RouteMap } from './RouteMap';
import { RouteSummary } from './RouteSummary';
import { EditRouteModal } from './EditRouteModal';
import type { TollStation } from './useRouteDetail';
import styles from './RouteDetailPage.module.css';

interface TollResult {
  toll: TollStation;
  isOnOutbound: boolean;
  isOnReturn: boolean;
}

export const RouteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { route, tolls, isLoading, error } = useRouteDetail(id!);

  const [tollResults, setTollResults] = useState<TollResult[]>([]);
  const [outboundKm, setOutboundKm] = useState(0);
  const [returnKm, setReturnKm] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Cargando ruta...</p>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className={styles.errorContainer}>
        <p>Error al cargar la ruta.</p>
      </div>
    );
  }

  const totalLiters = route.route_waypoints.reduce(
    (sum, wp) => sum + (wp.planned_pickup_amount || 0), 0
  );

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['geometry']}>
      <div className={styles.pageContainer}>
        <RouteHeader route={route} onEdit={() => setIsEditOpen(true)} />

        <RouteSummary
          outboundKm={outboundKm}
          returnKm={returnKm}
          tollResults={tollResults}
          totalLiters={totalLiters}
          waypointCount={route.route_waypoints.length}
        />

        <RouteMap
          waypoints={route.route_waypoints}
          tolls={tolls}
          tollResults={tollResults}
          onTollsDetected={setTollResults}
          onDistanceCalculated={(ob, ret) => {
            setOutboundKm(ob);
            setReturnKm(ret);
          }}
        />

        <EditRouteModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          route={route}
        />
      </div>
    </APIProvider>
  );
};