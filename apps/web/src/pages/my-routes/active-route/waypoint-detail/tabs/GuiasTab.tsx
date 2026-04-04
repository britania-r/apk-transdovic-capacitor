// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/GuiasTab.tsx
import { useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';
import type { WaypointCollection } from '../../hooks/useWaypointCollection';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  collection: WaypointCollection | null;
  routeId: string;
  waypointId: string;
}

const BUCKET = 'route-documents';

export const GuiasTab = ({ collection }: Props) => {

  // Abrir archivo en nueva pestaña
  const openFile = useCallback(async (filePath: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      // silenciar error
    }
  }, []);

  const hasTransportistaFile = !!collection?.guia_transportista_file;
  const hasRemisionFile = !!collection?.guia_remision_file;

  return (
    <div className={styles.tabPanel}>
      {/* Guía de Transportista */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-file"></i> Guía de transportista
        </h3>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Número de guía</label>
          <div className={styles.readOnlyValue}>
            {collection?.guia_transportista_number || 'Sin asignar'}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Documento</label>
          {hasTransportistaFile ? (
            <div className={styles.guiaReceived}>
              <div className={styles.guiaReceivedInfo}>
                <i className="bx bx-check-circle"></i>
                <span>Guía recibida</span>
              </div>
              <button
                onClick={() => openFile(collection!.guia_transportista_file!)}
                className={styles.guiaOpenBtn}
              >
                <i className="bx bx-link-external"></i> Ver documento
              </button>
            </div>
          ) : (
            <div className={styles.guiaPending}>
              <i className="bx bx-time"></i>
              <span>Pendiente — El administrador aún no ha subido esta guía</span>
            </div>
          )}
        </div>
      </div>

      {/* Guía de Remisión */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-file"></i> Guía de remisión
        </h3>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Número de guía</label>
          <div className={styles.readOnlyValue}>
            {collection?.guia_remision_number || 'Sin asignar'}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Documento</label>
          {hasRemisionFile ? (
            <div className={styles.guiaReceived}>
              <div className={styles.guiaReceivedInfo}>
                <i className="bx bx-check-circle"></i>
                <span>Guía recibida</span>
              </div>
              <button
                onClick={() => openFile(collection!.guia_remision_file!)}
                className={styles.guiaOpenBtn}
              >
                <i className="bx bx-link-external"></i> Ver documento
              </button>
            </div>
          ) : (
            <div className={styles.guiaPending}>
              <i className="bx bx-time"></i>
              <span>Pendiente — El administrador aún no ha subido esta guía</span>
            </div>
          )}
        </div>
      </div>

      {/* Observaciones (solo lectura) */}
      {collection?.observations && (
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>
            <i className="bx bx-note"></i> Observaciones
          </h3>
          <div className={styles.readOnlyValue}>
            {collection.observations}
          </div>
        </div>
      )}
    </div>
  );
};