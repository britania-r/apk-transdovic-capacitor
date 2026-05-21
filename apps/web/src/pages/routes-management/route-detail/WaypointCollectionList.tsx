// File: apps/web/src/pages/routes-management/route-detail/WaypointCollectionList.tsx
import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { getSupabase } from '@transdovic/shared';
import { useSignedUrl } from '../../../hooks/useSignedUrl';
import type { WaypointDetail } from './useRouteDetail';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollections';
import styles from './RouteDetailPage.module.css';

const BUCKET = 'route-documents';

interface Props {
  waypoints: WaypointDetail[];
  getCollectionForWaypoint: (waypointId: string) => LiveCollection | undefined;
  getReadingsForCollection: (collectionId: string) => LiveTankReading[];
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'HH:mm'); } catch { return '—'; }
};

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  scheduled: { label: 'Programada', className: 'statusPending', icon: 'bx bx-calendar' },
  pending: { label: 'Pendiente', className: 'statusPending', icon: 'bx bx-circle' },
  in_progress: { label: 'En curso', className: 'statusInProgress', icon: 'bx bx-loader-alt bx-spin' },
  completed: { label: 'Completada', className: 'statusCompleted', icon: 'bx bx-check-circle' },
  skipped: { label: 'Omitida', className: 'statusSkipped', icon: 'bx bx-skip-next-circle' },
};

const openSignedFile = async (filePath: string) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  } catch { /* silenciar */ }
};

export const WaypointCollectionList = ({ waypoints, getCollectionForWaypoint, getReadingsForCollection }: Props) => {
  return (
    <div className={styles.collectionList}>
      <h3 className={styles.collectionListTitle}>
        <i className="bx bx-list-check"></i> Datos recolectados por parada
      </h3>
      {waypoints.map(wp => {
        const collection = getCollectionForWaypoint(wp.id);
        const readings = collection ? getReadingsForCollection(collection.id) : [];
        return (
          <WaypointCollectionCard
            key={wp.id}
            waypoint={wp}
            collection={collection}
            readings={readings}
          />
        );
      })}
    </div>
  );
};

// ── Card por parada ──

interface CardProps {
  waypoint: WaypointDetail;
  collection: LiveCollection | undefined;
  readings: LiveTankReading[];
}

const WaypointCollectionCard = ({ waypoint, collection, readings }: CardProps) => {
  const [expanded, setExpanded] = useState(false);
  const status = collection?.status || 'pending';
  const config = statusConfig[status] || statusConfig.pending;
  const farm = waypoint.farm;

  const hasData = !!collection && (
    collection.arrival_time ||
    collection.precinto_ingreso ||
    readings.length > 0
  );

  const totalKg = readings.reduce((sum, r) => sum + (r.kg_direct ?? r.kg ?? 0), 0);

  // Fotos de lecturas de tanques
  const photosWithTank = readings
    .filter(r => r.photo_file)
    .map(r => ({ filePath: r.photo_file!, tankName: r.tank?.name || 'Tanque' }));

  // Archivos de guías
  const hasGuiaFiles = !!collection?.guia_transportista_file || !!collection?.guia_remision_file;

  return (
    <div className={`${styles.collectionCard} ${styles[config.className] || ''}`}>
      {/* Header clickeable */}
      <button className={styles.collectionCardHeader} onClick={() => setExpanded(!expanded)}>
        <span className={`${styles.collectionDot} ${styles[config.className] || ''}`}>
          <i className={config.icon}></i>
        </span>

        <span className={styles.collectionOrder}>{waypoint.stop_order}</span>

        <div className={styles.collectionInfo}>
          <span className={styles.collectionFarm}>{farm?.name || 'Desconocida'}</span>
          <span className={styles.collectionMeta}>
            {farm?.ruc || '—'} · {waypoint.zone || '—'} · {(waypoint.planned_pickup_amount || 0).toLocaleString()} L plan.
          </span>
        </div>

        {hasData && (
          <div className={styles.collectionQuickStats}>
            {totalKg > 0 && (
              <span className={styles.collectionStat}>
                <i className="bx bx-package"></i> {totalKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
              </span>
            )}
          </div>
        )}

        <span className={`${styles.collectionBadge} ${styles[config.className] || ''}`}>
          {config.label}
        </span>

        <i className={`bx ${expanded ? 'bx-chevron-up' : 'bx-chevron-down'} ${styles.collectionChevron}`}></i>
      </button>

      {/* Contenido expandible */}
      {expanded && (
        <div className={styles.collectionBody}>
          {!hasData ? (
            <div className={styles.collectionEmpty}>
              <i className="bx bx-time"></i>
              <span>El conductor aún no ha registrado datos en esta parada</span>
            </div>
          ) : (
            <>
              {/* Tiempos y precintos */}
              <div className={styles.collectionSection}>
                <h4 className={styles.collectionSectionTitle}>Registro</h4>
                <div className={styles.collectionGrid}>
                  <div className={styles.collectionGridItem}>
                    <span className={styles.collectionGridLabel}>Llegada</span>
                    <span className={styles.collectionGridValue}>{formatTime(collection?.arrival_time || null)}</span>
                  </div>
                  <div className={styles.collectionGridItem}>
                    <span className={styles.collectionGridLabel}>Salida</span>
                    <span className={styles.collectionGridValue}>{formatTime(collection?.departure_time || null)}</span>
                  </div>
                  {collection?.precinto_ingreso && (
                    <div className={styles.collectionGridItem}>
                      <span className={styles.collectionGridLabel}>Precinto ingreso</span>
                      <span className={styles.collectionGridValue}>{collection.precinto_ingreso}</span>
                    </div>
                  )}
                  {collection?.precinto_salida && (
                    <div className={styles.collectionGridItem}>
                      <span className={styles.collectionGridLabel}>Precinto salida</span>
                      <span className={styles.collectionGridValue}>{collection.precinto_salida}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guías */}
              {(collection?.guia_transportista_number || collection?.guia_remision_number || hasGuiaFiles) && (
                <div className={styles.collectionSection}>
                  <h4 className={styles.collectionSectionTitle}>Guías</h4>

                  {(collection?.guia_transportista_number || collection?.guia_remision_number) && (
                    <div className={styles.collectionGrid}>
                      <div className={styles.collectionGridItem}>
                        <span className={styles.collectionGridLabel}>G. Transportista</span>
                        <span className={styles.collectionGridValue}>
                          {collection?.guia_transportista_number || '—'}
                        </span>
                      </div>
                      <div className={styles.collectionGridItem}>
                        <span className={styles.collectionGridLabel}>G. Remisión</span>
                        <span className={styles.collectionGridValue}>
                          {collection?.guia_remision_number || '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {hasGuiaFiles && (
                    <div className={styles.guiaFilesRow}>
                      {collection?.guia_transportista_file && (
                        <button
                          className={styles.guiaFileChip}
                          onClick={() => openSignedFile(collection.guia_transportista_file!)}
                        >
                          <i className="bx bx-file"></i> Ver G. Transportista
                        </button>
                      )}
                      {collection?.guia_remision_file && (
                        <button
                          className={styles.guiaFileChip}
                          onClick={() => openSignedFile(collection.guia_remision_file!)}
                        >
                          <i className="bx bx-file"></i> Ver G. Remisión
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lecturas de tanques */}
              {readings.length > 0 && (
                <div className={styles.collectionSection}>
                  <h4 className={styles.collectionSectionTitle}>Lecturas por tanque</h4>
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
                          {photosWithTank.length > 0 && <th>Foto</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {readings.map(r => {
                          const tankName = r.tank?.name || '—';
                          const reglaje = r.reading_cm !== null
                            ? `${r.reading_cm}.${r.reading_mm ?? 0}`
                            : r.reading_mm !== null ? `${r.reading_mm}` : '—';
                          const liters = r.table_liters ?? r.manual_liters ?? '—';
                          const kg = r.kg_direct ?? r.kg ?? '—';
                          const temp = r.temperature !== null ? `${r.temperature}°` : '—';
                          const highTemp = r.temperature !== null && r.temperature > 4;
                          const labText = !highTemp
                            ? '—'
                            : r.lab_authorized === true ? 'Sí'
                            : r.lab_authorized === false ? 'No'
                            : 'Pend.';

                          return (
                            <tr key={r.id}>
                              <td className={styles.readingTank}>{tankName}</td>
                              <td>{reglaje}</td>
                              <td>{liters}</td>
                              <td className={styles.readingKg}>{kg}</td>
                              <td className={highTemp ? styles.readingTempWarn : ''}>{temp}</td>
                              <td className={
                                r.lab_authorized === true ? styles.readingLabYes
                                : r.lab_authorized === false ? styles.readingLabNo
                                : ''
                              }>{labText}</td>
                              {photosWithTank.length > 0 && (
                                <td>
                                  {r.photo_file ? (
                                    <button
                                      onClick={() => openSignedFile(r.photo_file!)}
                                      className={styles.photoBtn}
                                      title="Ver foto"
                                    >
                                      <i className="bx bx-camera"></i>
                                    </button>
                                  ) : '—'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Fotos de tanques (thumbnails) */}
              {photosWithTank.length > 0 && (
                <div className={styles.collectionSection}>
                  <h4 className={styles.collectionSectionTitle}>Fotos</h4>
                  <div className={styles.photosGrid}>
                    {photosWithTank.map((p, i) => (
                      <PhotoThumb
                        key={i}
                        filePath={p.filePath}
                        label={p.tankName}
                        onOpen={openSignedFile}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Saldo y observaciones */}
              {(collection?.saldo !== null && collection?.saldo !== undefined) || collection?.observations ? (
                <div className={styles.collectionSection}>
                  <h4 className={styles.collectionSectionTitle}>Extras</h4>
                  {collection?.saldo !== null && collection?.saldo !== undefined && (
                    <div className={styles.collectionGrid}>
                      <div className={styles.collectionGridItem}>
                        <span className={styles.collectionGridLabel}>Saldo</span>
                        <span className={styles.collectionGridValue}>{collection.saldo} L</span>
                      </div>
                    </div>
                  )}
                  {collection?.observations && (
                    <p className={styles.collectionObservation}>{collection.observations}</p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Photo thumbnail con signed URL cacheada ──

interface PhotoThumbProps {
  filePath: string;
  label: string;
  onOpen: (path: string) => void;
}

const PhotoThumb = ({ filePath, label, onOpen }: PhotoThumbProps) => {
  const { data: url, isLoading } = useSignedUrl(filePath);

  return (
    <button
      className={styles.photoThumb}
      onClick={() => onOpen(filePath)}
      title={label}
    >
      {isLoading ? (
        <span className={styles.photoThumbLoading}>
          <i className="bx bx-loader-alt bx-spin"></i>
        </span>
      ) : url ? (
        <img src={url} alt={label} />
      ) : (
        <i className="bx bx-image" style={{ color: 'var(--color-text-muted)' }}></i>
      )}
    </button>
  );
};