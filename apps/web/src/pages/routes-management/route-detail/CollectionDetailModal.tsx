// File: apps/web/src/pages/routes-management/route-detail/CollectionDetailModal.tsx
import { format, parseISO } from 'date-fns';
import { TankReadingsSummary } from './TankReadingsSummary';
import type { WaypointDetail } from './useRouteDetail';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollections';
import formStyles from '../../../components/ui/FormModal.module.css';
import styles from './LiveTracking.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  waypoint: WaypointDetail | undefined;
  collection: LiveCollection | undefined;
  readings: LiveTankReading[];
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'HH:mm');
  } catch {
    return '—';
  }
};

export const CollectionDetailModal = ({ isOpen, onClose, waypoint, collection, readings }: Props) => {
  if (!isOpen || !waypoint) return null;

  const farm = waypoint.farm;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={`${formStyles.modal} ${styles.detailModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bxs-store-alt"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>{farm?.name || 'Granja'}</h3>
              <p className={formStyles.modalSubtitle}>
                Parada {waypoint.stop_order} · {farm?.ruc || '—'} · {waypoint.zone || '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className={styles.detailBody}>
          {!collection ? (
            <div className={styles.detailEmpty}>
              <i className="bx bx-time"></i>
              <span>El conductor aún no ha registrado datos en esta parada</span>
              <span className={styles.detailEmptySub}>
                Planificado: {(waypoint.planned_pickup_amount || 0).toLocaleString()} L
              </span>
            </div>
          ) : (
            <>
              {/* Tiempos */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Tiempos</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Llegada</span>
                    <span className={styles.detailValue}>{formatTime(collection.arrival_time)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Salida</span>
                    <span className={styles.detailValue}>{formatTime(collection.departure_time)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estado</span>
                    <span className={`${styles.detailValue} ${styles.detailStatus}`}>
                      {collection.status === 'completed' ? 'Completada' :
                       collection.status === 'in_progress' ? 'En curso' : collection.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Precintos */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Precintos</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ingreso</span>
                    <span className={styles.detailValue}>{collection.precinto_ingreso || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Salida</span>
                    <span className={styles.detailValue}>{collection.precinto_salida || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Guías */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Guías</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Transportista</span>
                    <span className={styles.detailValue}>{collection.guia_transportista_number || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Remisión</span>
                    <span className={styles.detailValue}>{collection.guia_remision_number || '—'}</span>
                  </div>
                </div>
                <div className={styles.detailFileLinks}>
                  {collection.guia_transportista_file && (
                    <span className={styles.detailFileTag}>
                      <i className="bx bx-file"></i> GT adjunta
                    </span>
                  )}
                  {collection.guia_remision_file && (
                    <span className={styles.detailFileTag}>
                      <i className="bx bx-file"></i> GR adjunta
                    </span>
                  )}
                </div>
              </div>

              {/* Lecturas de tanques */}
              {readings.length > 0 && (
                <div className={styles.detailSection}>
                  <h4 className={styles.detailSectionTitle}>Lecturas por tanque</h4>
                  <TankReadingsSummary readings={readings} />
                </div>
              )}

              {/* Saldo y observaciones */}
              {(collection.saldo || collection.observations) && (
                <div className={styles.detailSection}>
                  <h4 className={styles.detailSectionTitle}>Extras</h4>
                  <div className={styles.detailGrid}>
                    {collection.saldo !== null && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Saldo</span>
                        <span className={styles.detailValue}>{collection.saldo} L</span>
                      </div>
                    )}
                  </div>
                  {collection.observations && (
                    <p className={styles.detailObservation}>{collection.observations}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};