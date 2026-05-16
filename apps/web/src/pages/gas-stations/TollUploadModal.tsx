// File: apps/web/src/pages/gas-stations/TollUploadModal.tsx
import { useState, useRef, useEffect } from 'react';
import styles from '../../components/ui/FormModal.module.css';
import tabStyles from '../fuel-vouchers/ValesTabs.module.css';
import mapStyles from './PeajeFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, source: 'covisol' | 'comsatel') => void;
  isLoading: boolean;
}

export const TollUploadModal = ({ isOpen, onClose, onUpload, isLoading }: Props) => {
  const [source, setSource] = useState<'covisol' | 'comsatel'>('covisol');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    if (!file) return;
    onUpload(file, source);
  };

  // Limpiar al abrir
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setSource('covisol');
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-upload"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Subir registros</h3>
              <p className={styles.modalSubtitle}>
                Selecciona la fuente y sube el archivo Excel
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className={styles.formBody}>
          {/* Selector de fuente */}
          <div className={styles.field}>
            <label className={styles.label}>
              Fuente <span className={styles.required}>*</span>
            </label>
            <div className={mapStyles.radioGroup}>
              <label className={`${mapStyles.radioOption} ${source === 'covisol' ? mapStyles.radioActive : ''}`}>
                <input
                  type="radio"
                  name="source"
                  value="covisol"
                  checked={source === 'covisol'}
                  onChange={() => setSource('covisol')}
                />
                <i className="bx bx-check-circle"></i>
                COVISOL
              </label>
              <label className={`${mapStyles.radioOption} ${source === 'comsatel' ? mapStyles.radioActive : ''}`}>
                <input
                  type="radio"
                  name="source"
                  value="comsatel"
                  checked={source === 'comsatel'}
                  onChange={() => setSource('comsatel')}
                />
                <i className="bx bx-check-circle"></i>
                COMSATEL
              </label>
            </div>
          </div>

          {/* Área de carga */}
          <div className={styles.field}>
            <label className={styles.label}>
              Archivo Excel <span className={styles.required}>*</span>
            </label>

            {!file ? (
              <div
                className={`${tabStyles.fileUploadArea} ${dragActive ? tabStyles.fileUploadAreaActive : ''}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <i className={`bx bx-cloud-upload ${tabStyles.fileUploadIcon}`}></i>
                <span className={tabStyles.fileUploadText}>
                  Arrastra el archivo aquí o haz clic para seleccionar
                </span>
                <span className={tabStyles.fileUploadHint}>
                  Archivos .xlsx o .xls
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className={tabStyles.fileSelected}>
                <i className={`bx bx-file ${tabStyles.fileSelectedIcon}`}></i>
                <div className={tabStyles.fileSelectedInfo}>
                  <div className={tabStyles.fileSelectedName}>{file.name}</div>
                  <div className={tabStyles.fileSelectedSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  className={tabStyles.fileSelectedRemove}
                  onClick={() => setFile(null)}
                  type="button"
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelBtn}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitBtn}
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Procesando...</>
            ) : (
              <><i className="bx bx-upload"></i> Subir y procesar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};