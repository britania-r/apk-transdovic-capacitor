// File: apps/web/src/pages/my-routes/active-route/ActiveRoutePage.tsx
import { useParams, Link } from 'react-router-dom';
import { useActiveRoute } from './hooks/useActiveRoute';
import { useAllCollections } from './hooks/useWaypointCollection';
import { useGpsTracking } from './hooks/useGpsTracking';
import { ActiveRouteHeader } from './ActiveRouteHeader';
import { ActiveRouteProgress } from './ActiveRouteProgress';
import { WaypointList } from './WaypointList';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useState } from 'react';
import styles from './ActiveRoutePage.module.css';

export const ActiveRoutePage = () => {
  const { id } = useParams<{ id: string }>();
  const { route, isLoading, error, startRoute, isStarting, completeRoute, isCompleting } = useActiveRoute(id!);
  const { data: collections = [] } = useAllCollections(id!);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const isInProgress = route?.status === 'in_progress';

  // GPS tracking: se activa solo cuando la ruta está en progreso
  useGpsTracking(id!, isInProgress);

  // Calcular progreso
  const totalWaypoints = route?.route_waypoints.length || 0;
  const completedWaypoints = collections.filter(c => c.status === 'completed').length;

  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando ruta...</span>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className={styles.stateContainer}>
        <i className="bx bx-error-circle"></i>
        <span>Error al cargar la ruta</span>
        <Link to="/mis-rutas" className={styles.backBtn}>
          <i className="bx bx-arrow-back"></i> Volver
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ActiveRouteHeader
        route={route}
        onStart={() => setShowStartModal(true)}
        onComplete={() => setShowCompleteModal(true)}
        isStarting={isStarting}
        isCompleting={isCompleting}
      />

      <ActiveRouteProgress
        total={totalWaypoints}
        completed={completedWaypoints}
      />

      <WaypointList
        waypoints={route.route_waypoints}
        collections={collections}
        routeId={route.id}
        isRouteActive={isInProgress}
      />

      {/* Modal confirmar inicio */}
      <ConfirmationModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onConfirm={() => {
          startRoute();
          setShowStartModal(false);
        }}
        title="Iniciar ruta"
        message={`¿Estás seguro de iniciar la ruta ${route.sap_route_id || ''}? Se activará el seguimiento GPS.`}
        confirmText="Sí, iniciar"
        isLoading={isStarting}
        variant="primary"
      />

      {/* Modal confirmar fin */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={() => {
          completeRoute();
          setShowCompleteModal(false);
        }}
        title="Finalizar ruta"
        message={`¿Estás seguro de finalizar la ruta? ${completedWaypoints}/${totalWaypoints} paradas completadas.`}
        confirmText="Sí, finalizar"
        isLoading={isCompleting}
        variant="warning"
      />
    </div>
  );
};