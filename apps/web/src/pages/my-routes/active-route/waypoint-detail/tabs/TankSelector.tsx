// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/TankSelector.tsx
import type { FarmTankWithType, TankReading } from '../../hooks/useTankReadings';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  tanks: FarmTankWithType[];
  activeTankIndex: number;
  onTankChange: (index: number) => void;
  readings: TankReading[];
}

export const TankSelector = ({ tanks, activeTankIndex, onTankChange, readings }: Props) => {
  // Verificar si un tanque ya tiene datos
  const hasTankData = (tankId: string): boolean => {
    const reading = readings.find(r => r.tank_id === tankId);
    if (!reading) return false;
    return !!(reading.kg || reading.kg_direct || reading.table_liters || reading.manual_liters);
  };

  return (
    <div className={styles.tankSelector}>
      {tanks.map((tank, index) => {
        const hasData = hasTankData(tank.id);
        const isActive = index === activeTankIndex;

        return (
          <button
            key={tank.id}
            onClick={() => onTankChange(index)}
            className={`${styles.tankTab} ${isActive ? styles.tankTabActive : ''} ${hasData ? styles.tankTabDone : ''}`}
          >
            <span className={styles.tankTabName}>{tank.name}</span>
            {tank.conversion_type && (
              <span className={styles.tankTabType}>
                {tank.conversion_type === 'decimal' ? 'Dec' : 'Ent'}
              </span>
            )}
            {!tank.conversion_type && (
              <span className={styles.tankTabType}>Manual</span>
            )}
            {hasData && (
              <i className="bx bx-check" style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}></i>
            )}
          </button>
        );
      })}
    </div>
  );
};