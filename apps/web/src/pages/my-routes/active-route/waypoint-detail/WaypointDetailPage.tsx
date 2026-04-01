// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/WaypointDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useActiveRoute } from '../hooks/useActiveRoute';
import { useWaypointCollection } from '../hooks/useWaypointCollection';
import { useFarmTanks } from '../hooks/useTankReadings';
import { WaypointTabs } from './WaypointTabs';
import { DataTab } from './tabs/DataTab';
import { PrecintosTab } from './tabs/PrecintosTab';
import { GuiasTab } from './tabs/GuiasTab';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import styles from './WaypointDetailPage.module.css';

export const WaypointDetailPage = () => {
  const { id: routeId, waypointId } = useParams<{ id: string; waypointId: string }>();
  const { route, isLoading: isRouteLoading } = useActiveRoute(routeId!);
  const { collection, isLoading: isCollectionLoading, save, isSaving, complete, isCompleting } = useWaypointCollection(waypointId!, routeId!);
  const [activeTab, setActiveTab] = useState('datos');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Encontrar el waypoint actual
  const waypoint = route?.route_waypoints.find(wp => wp.id === waypointId);
  const farm = waypoint?.farm;

  // Tanques de la granja
  const { data: tanks = [], isLoading: isTanksLoading } = useFarmTanks(farm?.id);

  const isLoading = isRouteLoading || isCollectionLoading || isTanksLoading;
  const isCompleted = collection?.status === 'completed';

  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando datos de la parada...</span>
      </div>
    );
  }

  if (!route || !waypoint || !farm) {
    return (
      <div className={styles.stateContainer}>
        <i className="bx bx-error-circle"></i>
        <span>No se encontró la parada</span>
        <Link to={`/mis-rutas/${routeId}`} className={styles.backBtn}>
          <i className="bx bx-arrow-back"></i> Volver a la ruta
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to={`/mis-rutas/${routeId}`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Volver
          </Link>

          {!isCompleted && collection && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className={styles.completeBtn}
              disabled={isCompleting}
            >
              <i className="bx bx-check"></i> Completar parada
            </button>
          )}

          {isCompleted && (
            <span className={styles.completedBadge}>
              <i className="bx bx-check-circle"></i> Completada
            </span>
          )}
        </div>

        <div className={styles.farmInfo}>
          <span className={styles.stopOrder}>{waypoint.stop_order}</span>
          <div>
            <h1 className={styles.farmName}>{farm.name}</h1>
            <span className={styles.farmMeta}>
              {farm.ruc} · {waypoint.zone || '—'} · {(waypoint.planned_pickup_amount || 0).toLocaleString()} L plan.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <WaypointTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tanksCount={tanks.length}
      />

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'datos' && (
          <DataTab
            collectionId={collection?.id}
            waypointId={waypointId!}
            routeId={routeId!}
            farmId={farm.id}
            tanks={tanks}
            isCompleted={isCompleted}
            onEnsureCollection={async () => {
              if (!collection) {
                await save({});
              }
            }}
          />
        )}

        {activeTab === 'precintos' && (
          <PrecintosTab
            collection={collection}
            onSave={save}
            isSaving={isSaving}
            isCompleted={isCompleted}
          />
        )}

        {activeTab === 'guias' && (
          <GuiasTab
            collection={collection}
            routeId={routeId!}
            waypointId={waypointId!}
            onSave={save}
            isSaving={isSaving}
            isCompleted={isCompleted}
          />
        )}
      </div>

      {/* Modal completar */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={() => {
          complete();
          setShowCompleteModal(false);
        }}
        title="Completar parada"
        message={`¿Estás seguro de marcar "${farm.name}" como completada? Los datos aún podrán verse pero no editarse.`}
        confirmText="Sí, completar"
        isLoading={isCompleting}
        variant="primary"
      />
    </div>
  );
};