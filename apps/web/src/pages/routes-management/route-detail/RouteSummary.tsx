// File: apps/web/src/pages/routes-management/route-detail/RouteSummary.tsx
import type { TollStation } from './useRouteDetail';
import styles from './RouteDetailPage.module.css';

interface TollResult {
  toll: TollStation;
  isOnOutbound: boolean;
  isOnReturn: boolean;
}

interface Props {
  outboundKm: number;
  returnKm: number;
  tollResults: TollResult[];
  totalLiters: number;
  waypointCount: number;
}

export const RouteSummary = ({ outboundKm, returnKm, tollResults, totalLiters, waypointCount }: Props) => {
  const totalKm = outboundKm + returnKm;

  // Calcular total de cobros de peajes
  const totalTollCharges = tollResults.reduce((sum, t) => {
    if (t.toll.billing_frequency === 2) {
      return sum + (t.isOnOutbound ? 1 : 0) + (t.isOnReturn ? 1 : 0);
    }
    return sum + (t.isOnOutbound ? 1 : 0);
  }, 0);

  return (
    <div className={styles.summary}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#16a34a' }}>
          <i className="bx bx-right-arrow-alt"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Ida</span>
          <span className={styles.summaryValue}>{outboundKm.toFixed(1)} km</span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#dc2626' }}>
          <i className="bx bx-left-arrow-alt"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Vuelta</span>
          <span className={styles.summaryValue}>{returnKm.toFixed(1)} km</span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#1e293b' }}>
          <i className="bx bx-trip"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Total recorrido</span>
          <span className={styles.summaryValue}>{totalKm.toFixed(1)} km</span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#f59e0b' }}>
          <i className="bx bx-traffic-cone"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Peajes</span>
          <span className={styles.summaryValue}>
            {tollResults.length} peaje{tollResults.length !== 1 ? 's' : ''} ({totalTollCharges} cobro{totalTollCharges !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#0ea5e9' }}>
          <i className="bx bx-droplet"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Litros a recoger</span>
          <span className={styles.summaryValue}>{totalLiters.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryIcon} style={{ color: '#8b5cf6' }}>
          <i className="bx bx-map-pin"></i>
        </span>
        <div>
          <span className={styles.summaryLabel}>Paradas</span>
          <span className={styles.summaryValue}>{waypointCount}</span>
        </div>
      </div>
    </div>
  );
};