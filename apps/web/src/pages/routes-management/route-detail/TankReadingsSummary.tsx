// File: apps/web/src/pages/routes-management/route-detail/TankReadingsSummary.tsx
import type { LiveTankReading } from './hooks/useLiveCollections';
import styles from './LiveTracking.module.css';

interface Props {
  readings: LiveTankReading[];
}

export const TankReadingsSummary = ({ readings }: Props) => {
  return (
    <div className={styles.readingsTable}>
      <table>
        <thead>
          <tr>
            <th>Tanque</th>
            <th>R</th>
            <th>L</th>
            <th>KG</th>
            <th>Temp</th>
            <th>Lab</th>
          </tr>
        </thead>
        <tbody>
          {readings.map(r => {
            const tankName = r.tank?.name || '—';
            const reglaje = r.reading_cm !== null
              ? `${r.reading_cm}/${r.reading_mm}`
              : r.reading_mm !== null
                ? `${r.reading_mm}`
                : '—';
            const liters = r.table_liters || r.manual_liters || '—';
            const kg = r.kg_direct || r.kg || '—';
            const temp = r.temperature !== null ? `${r.temperature}°` : '—';
            const needsLab = r.temperature !== null && r.temperature > 4;
            const labText = !needsLab
              ? '—'
              : r.lab_authorized === true
                ? 'Sí'
                : r.lab_authorized === false
                  ? 'No'
                  : 'Pend.';

            return (
              <tr key={r.id}>
                <td className={styles.readingTank}>{tankName}</td>
                <td>{reglaje}</td>
                <td>{liters}</td>
                <td className={styles.readingKg}>{kg}</td>
                <td className={needsLab ? styles.readingTempWarn : ''}>{temp}</td>
                <td className={
                  r.lab_authorized === true ? styles.readingLabYes :
                  r.lab_authorized === false ? styles.readingLabNo : ''
                }>{labText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};