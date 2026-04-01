// File: apps/web/src/pages/dashboard/Dashboard.tsx
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useAuth } from '../../hooks/useAuth';
import { useActiveRoutesToday } from './hooks/useActiveRoutesToday';
import { useLiveTrackingMulti } from './hooks/useLiveTrackingMulti';
import { useLiveCollectionsMulti } from './hooks/useLiveCollectionsMulti';
import { DashboardMap } from './DashboardMap';
import { DashboardDriverList } from './DashboardDriverList';
import { DashboardRouteDetail } from './DashboardRouteDetail';
import styles from './Dashboard.module.css';

const DashboardContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Toast de login
  useEffect(() => {
    if (location.state?.fromLogin) {
      toast.success('¡Inicio de sesión exitoso!');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Rutas activas del día
  const { data: activeRoutes = [], isLoading } = useActiveRoutesToday();

  // IDs de rutas para suscripciones
  const routeIds = useMemo(() => activeRoutes.map(r => r.id), [activeRoutes]);

  // Live tracking GPS de todas las rutas
  const { latestByRoute, selectedTrail } = useLiveTrackingMulti(routeIds, selectedRouteId);

  // Live collections de todas las rutas
  const {
    getCollectionForWaypoint,
    getReadingsForCollection,
    getCompletedCount,
  } = useLiveCollectionsMulti(routeIds);

  // Ruta seleccionada
  const selectedRoute = activeRoutes.find(r => r.id === selectedRouteId) || null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard</h1>
          {activeRoutes.length > 0 && (
            <span className={styles.activeBadge}>
              <span className={styles.activeDot}></span>
              {activeRoutes.length} ruta{activeRoutes.length !== 1 ? 's' : ''} en curso
            </span>
          )}
        </div>
        <span className={styles.welcomeText}>
          Bienvenido, <strong>{user?.email || 'Usuario'}</strong>
        </span>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando rutas activas...</span>
        </div>
      ) : activeRoutes.length === 0 ? (
        <div className={styles.stateBox}>
          <i className="bx bx-map-alt"></i>
          <span>No hay rutas en curso en este momento</span>
          <span className={styles.stateHint}>Las rutas aparecerán aquí cuando un conductor las inicie</span>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Panel izquierdo: lista de conductores */}
          <div className={styles.sidePanel}>
            <DashboardDriverList
              routes={activeRoutes}
              selectedRouteId={selectedRouteId}
              onSelect={setSelectedRouteId}
              getCompletedCount={getCompletedCount}
            />

            {/* Detalle de ruta seleccionada */}
            {selectedRoute && (
              <DashboardRouteDetail
                route={selectedRoute}
                getCollectionForWaypoint={getCollectionForWaypoint}
                getReadingsForCollection={getReadingsForCollection}
                getCompletedCount={getCompletedCount}
              />
            )}
          </div>

          {/* Mapa principal */}
          <div className={styles.mapPanel}>
            <DashboardMap
              routes={activeRoutes}
              latestByRoute={latestByRoute}
              selectedRouteId={selectedRouteId}
              selectedTrail={selectedTrail}
              onSelectRoute={setSelectedRouteId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <DashboardContent />
  </APIProvider>
);

export default Dashboard;