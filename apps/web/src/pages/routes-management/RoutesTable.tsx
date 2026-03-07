// File: apps/web/src/pages/routes-management/RoutesTable.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Route } from './RoutesPage';
import styles from '../../components/ui/Table.module.css';
import localStyles from './RoutesTable.module.css';

interface Props {
  routes: Route[];
  onDelete: (routeId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  localStyles.statusScheduled,
  in_progress: localStyles.statusInProgress,
  completed:  localStyles.statusCompleted,
  cancelled:  localStyles.statusCancelled,
};

const STATUS_LABELS: Record<string, string> = {
  scheduled:   'Programada',
  in_progress: 'En curso',
  completed:   'Completada',
  cancelled:   'Cancelada',
};

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
};

const getDriverName = (driver: Route['driver']) =>
  driver ? `${driver.first_name} ${driver.paternal_last_name}` : 'No asignado';

const getDriverInitials = (driver: Route['driver']) => {
  if (!driver) return 'NA';
  return `${driver.first_name[0]}${driver.paternal_last_name[0]}`.toUpperCase();
};

export const RoutesTable = ({ routes, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Conductor</th>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Hora salida</th>
              <th>Puntos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route.id}>
                {/* Conductor: avatar + nombre */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{getDriverName(route.driver)}</span>
                      <span className={styles.userEmail}>{route.vehicle?.plate || '—'}</span>
                    </div>
                  </div>
                </td>

                <td>{formatDate(route.route_date)}</td>

                <td className={styles.monoCell}>
                  {route.vehicle?.plate || '—'}
                </td>

                <td>{route.programed_start_time || '—'}</td>

                <td className={localStyles.pointsCell}>
                  {route.route_waypoints[0]?.count || 0}
                </td>

                {/* Status badge */}
                <td>
                  <span className={`${localStyles.statusBadge} ${STATUS_STYLES[route.status] || localStyles.statusDefault}`}>
                    {STATUS_LABELS[route.status] || route.status}
                  </span>
                </td>

                {/* Acciones: ver mapa + eliminar */}
                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/routes/list/${route.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver en mapa"
                    >
                      <i className="bx bx-map-alt"></i>
                    </Link>
                    <button
                      onClick={() => onDelete(route.id)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={styles.cardList}>
        {routes.map(route => (
          <div key={route.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{getDriverName(route.driver)}</span>
                  <span className={styles.userEmail}>{route.vehicle?.plate || '—'}</span>
                </div>
              </div>
              <span className={`${localStyles.statusBadge} ${STATUS_STYLES[route.status] || localStyles.statusDefault}`}>
                {STATUS_LABELS[route.status] || route.status}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Fecha</span>
                <span className={styles.metaValue}>{formatDate(route.route_date)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Hora salida</span>
                <span className={styles.metaValue}>{route.programed_start_time || '—'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Puntos</span>
                <span className={styles.metaValue}>{route.route_waypoints[0]?.count || 0}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                to={`/routes/list/${route.id}`}
                className={`${styles.cardBtn} ${styles.viewBtn}`}
              >
                <i className="bx bx-map-alt"></i> Ver mapa
              </Link>
              <button
                onClick={() => onDelete(route.id)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};