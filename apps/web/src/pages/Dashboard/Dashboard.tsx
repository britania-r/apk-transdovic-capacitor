// File: apps/web/src/pages/dashboard/Dashboard.tsx
import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useActiveRoutesToday } from './hooks/useActiveRoutesToday';
import { useLiveCollectionsMulti } from './hooks/useLiveCollectionsMulti';
import { DashboardDriverList } from './DashboardDriverList';
import { DashboardRouteDetail } from './DashboardRouteDetail';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Redirigir conductor a mis-rutas
  useEffect(() => {
    if (profile?.role === 'Conductor carga pesada') {
      navigate('/mis-rutas', { replace: true });
    }
  }, [profile, navigate]);

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

  // Live collections de todas las rutas
  const {
    getCollectionForWaypoint,
    getReadingsForCollection,
    getCompletedCount,
    refetchCollections,
  } = useLiveCollectionsMulti(routeIds);

  // Ruta seleccionada
  const selectedRoute = activeRoutes.find(r => r.id === selectedRouteId) || null;

  // Auto-seleccionar primera ruta si no hay selección
  useEffect(() => {
    if (!selectedRouteId && activeRoutes.length > 0) {
      setSelectedRouteId(activeRoutes[0].id);
    }
  }, [activeRoutes, selectedRouteId]);

  // Si es conductor, no renderizar nada (se redirige)
  if (profile?.role === 'Conductor carga pesada') {
    return null;
  }

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

      {/* Contenido */}
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
          </div>

          {/* Panel derecho: detalle de ruta seleccionada */}
          <div className={styles.mainPanel}>
            {selectedRoute ? (
              <DashboardRouteDetail
                route={selectedRoute}
                getCollectionForWaypoint={getCollectionForWaypoint}
                getReadingsForCollection={getReadingsForCollection}
                getCompletedCount={getCompletedCount}
                onGuiaUploaded={refetchCollections}
              />
            ) : (
              <div className={styles.stateBox}>
                <i className="bx bx-pointer"></i>
                <span>Selecciona una ruta para ver los detalles</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;