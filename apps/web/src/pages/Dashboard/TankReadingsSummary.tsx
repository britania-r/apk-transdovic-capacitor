// File: apps/web/src/pages/dashboard/TankReadingsSummary.tsx
import { useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';
import type { LiveTankReading } from './hooks/useLiveCollectionsMulti';
import styles from './CollectionDetailModal.module.css';

const BUCKET = 'route-documents';

interface Props {
  readings: LiveTankReading[];
}

export const TankReadingsSummary = ({ readings }: Props) => {
  const openPhoto = useCallback(async (filePath: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      // silenciar
    }
  }, []);

  const hasAnyPhoto = readings.some(r => !!r.photo_file);

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
            {hasAnyPhoto && <th>Foto</th>}
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
                {hasAnyPhoto && (
                  <td>
                    {r.photo_file ? (
                      <button
                        onClick={() => openPhoto(r.photo_file!)}
                        className={styles.photoBtn}
                        title="Ver foto"
                      >
                        <i className="bx bx-camera"></i>
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};