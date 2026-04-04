// File: apps/web/src/pages/dashboard/CollectionDetailModal.tsx
import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { TankReadingsSummary } from './TankReadingsSummary';
import type { LiveCollection, LiveTankReading } from './hooks/useLiveCollectionsMulti';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './CollectionDetailModal.module.css';

const BUCKET = 'route-documents';

type UploadingType = 'guia-transportista' | 'guia-remision' | null;

interface Waypoint {
  id: string;
  stop_order: number;
  planned_pickup_amount: number;
  zone: string;
  farm: { id: string; name: string; ruc: string } | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  waypoint: Waypoint | null;
  collection: LiveCollection | undefined;
  readings: LiveTankReading[];
  routeId: string;
  onGuiaUploaded: () => void;
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'HH:mm');
  } catch {
    return '—';
  }
};

export const CollectionDetailModal = ({ isOpen, onClose, waypoint, collection, readings, routeId, onGuiaUploaded }: Props) => {
  const [uploadingType, setUploadingType] = useState<UploadingType>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [guiaTransportistaNum, setGuiaTransportistaNum] = useState('');
  const [guiaRemisionNum, setGuiaRemisionNum] = useState('');
  const transportistaRef = useRef<HTMLInputElement>(null);
  const remisionRef = useRef<HTMLInputElement>(null);

  // Sincronizar campos con colección existente
  useEffect(() => {
    if (collection) {
      setGuiaTransportistaNum(collection.guia_transportista_number || '');
      setGuiaRemisionNum(collection.guia_remision_number || '');
    } else {
      setGuiaTransportistaNum('');
      setGuiaRemisionNum('');
    }
  }, [collection]);

  if (!isOpen || !waypoint) return null;

  const farm = waypoint.farm;
  const hasDriverData = !!collection && (
    collection.precinto_ingreso ||
    collection.precinto_salida ||
    collection.arrival_time ||
    readings.length > 0
  );

  // Asegurar que exista la colección, crear si no
  const ensureCollection = async (): Promise<string> => {
    if (collection) return collection.id;

    const supabase = getSupabase();
    const { data, error } = await (supabase as any)
      .from('waypoint_collections')
      .insert({
        waypoint_id: waypoint.id,
        route_id: routeId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id;
  };

  // Guardar números de guía
  const handleSaveNumbers = async () => {
    setIsSaving(true);
    try {
      const collectionId = await ensureCollection();
      const supabase = getSupabase();

      const { error } = await (supabase as any)
        .from('waypoint_collections')
        .update({
          guia_transportista_number: guiaTransportistaNum || null,
          guia_remision_number: guiaRemisionNum || null,
        })
        .eq('id', collectionId);

      if (error) throw new Error(error.message);
      toast.success('Números de guía guardados');
      onGuiaUploaded();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Subir archivo de guía
  const handleUpload = async (
    file: File,
    type: 'guia-transportista' | 'guia-remision'
  ) => {
    setUploadingType(type);
    try {
      const collectionId = await ensureCollection();
      const supabase = getSupabase();
      const ext = file.name.split('.').pop() || 'pdf';
      const timestamp = Date.now();
      const path = `routes/${routeId}/${waypoint.id}/${type}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const updateField = type === 'guia-transportista'
        ? { guia_transportista_file: path }
        : { guia_remision_file: path };

      const { error: updateError } = await (supabase as any)
        .from('waypoint_collections')
        .update(updateField)
        .eq('id', collectionId);
      if (updateError) throw new Error(updateError.message);

      toast.success(type === 'guia-transportista'
        ? 'Guía de transportista subida'
        : 'Guía de remisión subida'
      );
      onGuiaUploaded();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUploadingType(null);
    }
  };

  // Abrir archivo
  const openFile = async (filePath: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      toast.error('Error al abrir archivo');
    }
  };

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

          {/* ── Sección de guías (siempre visible, editable por admin) ── */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>
              <i className="bx bx-file" style={{ color: 'var(--color-primary)' }}></i> Guías
            </h4>

            {/* Números de guía editables */}
            <div className={styles.guiaFieldsRow}>
              <div className={styles.guiaField}>
                <label className={styles.guiaFieldLabel}>N° G. Transportista</label>
                <input
                  type="text"
                  value={guiaTransportistaNum}
                  onChange={e => setGuiaTransportistaNum(e.target.value)}
                  className={styles.guiaFieldInput}
                  placeholder="Ej: 001-000123"
                />
              </div>
              <div className={styles.guiaField}>
                <label className={styles.guiaFieldLabel}>N° G. Remisión</label>
                <input
                  type="text"
                  value={guiaRemisionNum}
                  onChange={e => setGuiaRemisionNum(e.target.value)}
                  className={styles.guiaFieldInput}
                  placeholder="Ej: 001-000456"
                />
              </div>
            </div>

            <button
              onClick={handleSaveNumbers}
              disabled={isSaving}
              className={styles.guiaSaveBtn}
            >
              {isSaving ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-save"></i> Guardar números</>
              )}
            </button>

            {/* Upload guía transportista */}
            <div className={styles.guiaUploadRow}>
              <span className={styles.guiaUploadLabel}>
                <i className="bx bx-file"></i> Guía transportista
              </span>
              {collection?.guia_transportista_file ? (
                <button
                  onClick={() => openFile(collection.guia_transportista_file!)}
                  className={styles.guiaViewBtn}
                >
                  <i className="bx bx-link-external"></i> Ver
                </button>
              ) : (
                <div className={styles.guiaUploadAction}>
                  <input
                    ref={transportistaRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'guia-transportista');
                    }}
                    className={styles.guiaFileInput}
                    id={`gt-upload-${waypoint.id}`}
                    disabled={uploadingType !== null}
                  />
                  <label htmlFor={`gt-upload-${waypoint.id}`} className={styles.guiaUploadBtn}>
                    {uploadingType === 'guia-transportista'
                      ? <i className="bx bx-loader-alt bx-spin"></i>
                      : <i className="bx bx-cloud-upload"></i>
                    }
                    Subir
                  </label>
                </div>
              )}
            </div>

            {/* Upload guía remisión */}
            <div className={styles.guiaUploadRow}>
              <span className={styles.guiaUploadLabel}>
                <i className="bx bx-file"></i> Guía remisión
              </span>
              {collection?.guia_remision_file ? (
                <button
                  onClick={() => openFile(collection.guia_remision_file!)}
                  className={styles.guiaViewBtn}
                >
                  <i className="bx bx-link-external"></i> Ver
                </button>
              ) : (
                <div className={styles.guiaUploadAction}>
                  <input
                    ref={remisionRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'guia-remision');
                    }}
                    className={styles.guiaFileInput}
                    id={`gr-upload-${waypoint.id}`}
                    disabled={uploadingType !== null}
                  />
                  <label htmlFor={`gr-upload-${waypoint.id}`} className={styles.guiaUploadBtn}>
                    {uploadingType === 'guia-remision'
                      ? <i className="bx bx-loader-alt bx-spin"></i>
                      : <i className="bx bx-cloud-upload"></i>
                    }
                    Subir
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ── Datos del conductor (solo si hay datos registrados) ── */}
          {hasDriverData ? (
            <>
              {/* Tiempos */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Datos del conductor</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Llegada</span>
                    <span className={styles.detailValue}>{formatTime(collection?.arrival_time || null)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Salida</span>
                    <span className={styles.detailValue}>{formatTime(collection?.departure_time || null)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estado</span>
                    <span className={styles.detailValue}>
                      {collection?.status === 'completed' ? 'Completada' :
                       collection?.status === 'in_progress' ? 'En curso' :
                       collection?.status || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Precintos */}
              {(collection?.precinto_ingreso || collection?.precinto_salida) && (
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
              )}

              {/* Lecturas de tanques */}
              {readings.length > 0 && (
                <div className={styles.detailSection}>
                  <h4 className={styles.detailSectionTitle}>Lecturas por tanque</h4>
                  <TankReadingsSummary readings={readings} />
                </div>
              )}

              {/* Saldo y observaciones */}
              {(collection?.saldo !== null || collection?.observations) && (
                <div className={styles.detailSection}>
                  <h4 className={styles.detailSectionTitle}>Extras</h4>
                  {collection?.saldo !== null && collection?.saldo !== undefined && (
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Saldo</span>
                        <span className={styles.detailValue}>{collection.saldo} L</span>
                      </div>
                    </div>
                  )}
                  {collection?.observations && (
                    <p className={styles.detailObservation}>{collection.observations}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Sin datos del conductor aún */
            <div className={styles.driverDataPending}>
              <i className="bx bx-time"></i>
              <span>El conductor aún no ha registrado datos en esta parada</span>
              <span className={styles.driverDataPendingSub}>
                Planificado: {(waypoint.planned_pickup_amount || 0).toLocaleString()} L
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};