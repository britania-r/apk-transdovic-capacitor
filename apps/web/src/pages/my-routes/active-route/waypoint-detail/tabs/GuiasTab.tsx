// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/GuiasTab.tsx
import { useState, useEffect, useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import type { WaypointCollection, WaypointCollectionInput } from '../../hooks/useWaypointCollection';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  collection: WaypointCollection | null | undefined;
  routeId: string;
  waypointId: string;
  onSave: (input: WaypointCollectionInput) => Promise<any>;
  isSaving: boolean;
  isCompleted: boolean;
}

export const GuiasTab = ({ collection, routeId, waypointId, onSave, isSaving, isCompleted }: Props) => {
  const { upload, isUploading, error: uploadError } = useFileUpload();

  const [guiaTransportistaNum, setGuiaTransportistaNum] = useState('');
  const [guiaRemisionNum, setGuiaRemisionNum] = useState('');
  const [guiaTransportistaFile, setGuiaTransportistaFile] = useState('');
  const [guiaRemisionFile, setGuiaRemisionFile] = useState('');
  const [observations, setObservations] = useState('');

  const transportistaRef = useRef<HTMLInputElement>(null);
  const remisionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (collection) {
      setGuiaTransportistaNum(collection.guia_transportista_number || '');
      setGuiaRemisionNum(collection.guia_remision_number || '');
      setGuiaTransportistaFile(collection.guia_transportista_file || '');
      setGuiaRemisionFile(collection.guia_remision_file || '');
      setObservations(collection.observations || '');
    }
  }, [collection]);

  const handleFileUpload = async (
    file: File,
    type: 'guia-transportista' | 'guia-remision'
  ) => {
    const result = await upload(file, routeId, waypointId, type);
    if (result) {
      if (type === 'guia-transportista') {
        setGuiaTransportistaFile(result.path);
      } else {
        setGuiaRemisionFile(result.path);
      }
    }
  };

  const handleSave = async () => {
    await onSave({
      guia_transportista_number: guiaTransportistaNum || undefined,
      guia_remision_number: guiaRemisionNum || undefined,
      guia_transportista_file: guiaTransportistaFile || undefined,
      guia_remision_file: guiaRemisionFile || undefined,
      observations: observations || undefined,
    });
  };

  const disabled = isCompleted;

  return (
    <div className={styles.tabPanel}>
      {/* Guía de Transportista */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-file"></i> Guía de transportista
        </h3>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Número de guía</label>
          <input
            type="text"
            value={guiaTransportistaNum}
            onChange={e => setGuiaTransportistaNum(e.target.value)}
            className={styles.fieldInput}
            placeholder="Ej: 001-000123"
            disabled={disabled}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Documento adjunto</label>
          {guiaTransportistaFile ? (
            <div className={styles.fileUploaded}>
              <i className="bx bx-check-circle" style={{ color: 'var(--color-success)' }}></i>
              <span>Archivo adjuntado</span>
              {!disabled && (
                <button
                  onClick={() => {
                    setGuiaTransportistaFile('');
                    if (transportistaRef.current) transportistaRef.current.value = '';
                  }}
                  className={styles.fileRemoveBtn}
                >
                  <i className="bx bx-x"></i>
                </button>
              )}
            </div>
          ) : (
            <div className={styles.fileUploadArea}>
              <input
                ref={transportistaRef}
                type="file"
                accept="image/*,.pdf"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, 'guia-transportista');
                }}
                className={styles.fileInputHidden}
                id="guia-transportista-input"
                disabled={disabled || isUploading}
              />
              <label htmlFor="guia-transportista-input" className={styles.fileUploadLabel}>
                {isUploading ? (
                  <><i className="bx bx-loader-alt bx-spin"></i> Subiendo...</>
                ) : (
                  <><i className="bx bx-cloud-upload"></i> Adjuntar archivo</>
                )}
              </label>
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
          <input
            type="text"
            value={guiaRemisionNum}
            onChange={e => setGuiaRemisionNum(e.target.value)}
            className={styles.fieldInput}
            placeholder="Ej: 001-000456"
            disabled={disabled}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Documento adjunto</label>
          {guiaRemisionFile ? (
            <div className={styles.fileUploaded}>
              <i className="bx bx-check-circle" style={{ color: 'var(--color-success)' }}></i>
              <span>Archivo adjuntado</span>
              {!disabled && (
                <button
                  onClick={() => {
                    setGuiaRemisionFile('');
                    if (remisionRef.current) remisionRef.current.value = '';
                  }}
                  className={styles.fileRemoveBtn}
                >
                  <i className="bx bx-x"></i>
                </button>
              )}
            </div>
          ) : (
            <div className={styles.fileUploadArea}>
              <input
                ref={remisionRef}
                type="file"
                accept="image/*,.pdf"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, 'guia-remision');
                }}
                className={styles.fileInputHidden}
                id="guia-remision-input"
                disabled={disabled || isUploading}
              />
              <label htmlFor="guia-remision-input" className={styles.fileUploadLabel}>
                {isUploading ? (
                  <><i className="bx bx-loader-alt bx-spin"></i> Subiendo...</>
                ) : (
                  <><i className="bx bx-cloud-upload"></i> Adjuntar archivo</>
                )}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Observaciones generales */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-note"></i> Observaciones
        </h3>
        <div className={styles.field}>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            className={styles.fieldTextarea}
            placeholder="Observaciones generales de esta parada..."
            rows={3}
            disabled={disabled}
          />
        </div>
      </div>

      {uploadError && (
        <div className={styles.uploadError}>
          <i className="bx bx-error-circle"></i> {uploadError}
        </div>
      )}

      {!disabled && (
        <button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className={styles.saveBtn}
        >
          {isSaving ? (
            <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
          ) : (
            <><i className="bx bx-save"></i> Guardar guías</>
          )}
        </button>
      )}
    </div>
  );
};