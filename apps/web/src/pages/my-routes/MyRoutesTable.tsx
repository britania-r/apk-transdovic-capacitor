// File: apps/web/src/pages/my-routes/MyRoutesTable.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MyRoute } from './MyRoutesPage';
import styles from '../../components/ui/Table.module.css';
import localStyles from './MyRoutesTable.module.css';

interface Props {
  routes: MyRoute[];
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:   localStyles.statusScheduled,
  in_progress: localStyles.statusInProgress,
  completed:   localStyles.statusCompleted,
  cancelled:   localStyles.statusCancelled,
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

export const MyRoutesTable = ({ routes }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ruta SAP</th>
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
                <td>{formatDate(route.route_date)}</td>

                <td className={styles.monoCell}>
                  {route.sap_route_id || '—'}
                </td>

                <td className={styles.monoCell}>
                  {route.vehicle?.plate || '—'}
                </td>

                <td>{route.programed_start_time || '—'}</td>

                <td className={localStyles.pointsCell}>
                  {route.route_waypoints[0]?.count || 0}
                </td>

                <td>
                  <span className={`${localStyles.statusBadge} ${STATUS_STYLES[route.status] || localStyles.statusDefault}`}>
                    {STATUS_LABELS[route.status] || route.status}
                  </span>
                </td>

                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/mis-rutas/${route.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver detalle"
                    >
                      <i className="bx bx-map-alt"></i>
                    </Link>
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
                  <span className={styles.userName}>{route.vehicle?.plate || '—'}</span>
                  <span className={styles.userEmail}>{route.sap_route_id || '—'}</span>
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
                to={`/mis-rutas/${route.id}`}
                className={`${styles.cardBtn} ${styles.viewBtn}`}
              >
                <i className="bx bx-map-alt"></i> Ver detalle
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};