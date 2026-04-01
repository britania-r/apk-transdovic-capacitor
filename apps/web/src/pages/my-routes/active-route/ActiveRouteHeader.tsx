// File: apps/web/src/pages/my-routes/active-route/ActiveRouteHeader.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActiveRouteDetail } from './hooks/useActiveRoute';
import styles from './ActiveRoutePage.module.css';

interface Props {
  route: ActiveRouteDetail;
  onStart: () => void;
  onComplete: () => void;
  isStarting: boolean;
  isCompleting: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "EEEE dd 'de' MMMM", { locale: es });
  } catch {
    return dateStr;
  }
};

export const ActiveRouteHeader = ({ route, onStart, onComplete, isStarting, isCompleting }: Props) => {
  const isScheduled = route.status === 'scheduled';
  const isInProgress = route.status === 'in_progress';
  const isCompleted = route.status === 'completed';

  const totalLiters = route.route_waypoints.reduce(
    (sum, wp) => sum + (wp.planned_pickup_amount || 0), 0
  );

  return (
    <div className={styles.header}>
      {/* Top: volver + estado + acción */}
      <div className={styles.headerTop}>
        <Link to="/mis-rutas" className={styles.backLink}>
          <i className="bx bx-arrow-back"></i> Mis rutas
        </Link>

        <div className={styles.headerActions}>
          {isScheduled && (
            <button
              onClick={onStart}
              disabled={isStarting}
              className={styles.startBtn}
            >
              {isStarting ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Iniciando...</>
              ) : (
                <><i className="bx bx-play"></i> Iniciar ruta</>
              )}
            </button>
          )}

          {isInProgress && (
            <button
              onClick={onComplete}
              disabled={isCompleting}
              className={styles.completeBtn}
            >
              {isCompleting ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Finalizando...</>
              ) : (
                <><i className="bx bx-check"></i> Finalizar ruta</>
              )}
            </button>
          )}

          <span className={`${styles.statusBadge} ${styles[`status_${route.status}`] || ''}`}>
            {STATUS_LABELS[route.status] || route.status}
          </span>
        </div>
      </div>

      {/* Info de la ruta */}
      <div className={styles.routeInfo}>
        <h1 className={styles.routeTitle}>
          {route.sap_route_id || 'Ruta'}
          <span className={styles.routeDate}>{formatDate(route.route_date)}</span>
        </h1>
      </div>

      {/* Grid de datos rápidos */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <i className="bx bx-car"></i>
          <div>
            <span className={styles.infoLabel}>Vehículo</span>
            <span className={styles.infoValue}>{route.vehicle?.plate || '—'}</span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <i className="bx bx-time"></i>
          <div>
            <span className={styles.infoLabel}>Salida</span>
            <span className={styles.infoValue}>{route.programed_start_time || '—'}</span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <i className="bx bx-time-five"></i>
          <div>
            <span className={styles.infoLabel}>Llegada</span>
            <span className={styles.infoValue}>{route.programed_arrival_time || '—'}</span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <i className="bx bx-map-pin"></i>
          <div>
            <span className={styles.infoLabel}>Paradas</span>
            <span className={styles.infoValue}>{route.route_waypoints.length}</span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <i className="bx bx-droplet"></i>
          <div>
            <span className={styles.infoLabel}>Litros plan.</span>
            <span className={styles.infoValue}>{totalLiters.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <i className="bx bx-lock-alt"></i>
          <div>
            <span className={styles.infoLabel}>Precintos</span>
            <span className={styles.infoValue}>{route.precintos_count || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};