// File: apps/web/src/pages/routes-management/route-detail/RouteCollectionSummary.tsx
import type { WaypointDetail } from './useRouteDetail';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollections';
import styles from './RouteDetailPage.module.css';

interface Props {
  waypoints: WaypointDetail[];
  collections: LiveCollection[];
  tankReadings: LiveTankReading[];
}

export const RouteCollectionSummary = ({ waypoints, collections, tankReadings }: Props) => {
  const totalWaypoints = waypoints.length;
  const completedCount = collections.filter(c => c.status === 'completed').length;
  const inProgressCount = collections.filter(c => c.status === 'in_progress').length;

  const plannedLiters = waypoints.reduce((sum, wp) => sum + (wp.planned_pickup_amount || 0), 0);

  const realKg = tankReadings.reduce((sum, r) => sum + (r.kg_direct ?? r.kg ?? 0), 0);

  const realLiters = tankReadings.reduce((sum, r) => sum + (r.table_liters ?? r.manual_liters ?? 0), 0);

  const avgTemp = (() => {
    const temps = tankReadings.filter(r => r.temperature !== null).map(r => r.temperature!);
    if (temps.length === 0) return null;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
  })();

  const tempAlerts = tankReadings.filter(r => r.temperature !== null && r.temperature > 4).length;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#16a34a' }}>
          <i className="bx bx-check-double"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Progreso</span>
          <span className={styles.summaryValue}>
            {completedCount}/{totalWaypoints}
            {inProgressCount > 0 && ` (${inProgressCount} en curso)`}
          </span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#0ea5e9' }}>
          <i className="bx bx-droplet"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Litros plan. / real</span>
          <span className={styles.summaryValue}>
            {plannedLiters.toLocaleString()} / {realLiters.toLocaleString()}
          </span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#8b5cf6' }}>
          <i className="bx bx-package"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>KG recolectados</span>
          <span className={styles.summaryValue}>
            {realKg > 0 ? realKg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#f59e0b' }}>
          <i className="bx bx-thermometer"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Temp. promedio</span>
          <span className={styles.summaryValue}>
            {avgTemp !== null ? `${avgTemp.toFixed(1)}°C` : '—'}
            {tempAlerts > 0 && (
              <span className={styles.summaryAlert}> ({tempAlerts} alerta{tempAlerts !== 1 ? 's' : ''})</span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#1e293b' }}>
          <i className="bx bx-data"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Lecturas</span>
          <span className={styles.summaryValue}>{tankReadings.length} tanque{tankReadings.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#dc2626' }}>
          <i className="bx bx-map-pin"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Paradas</span>
          <span className={styles.summaryValue}>{totalWaypoints}</span>
        </div>
      </div>
    </div>
  );
};