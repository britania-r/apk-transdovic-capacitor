// File: apps/web/src/pages/fuel-vouchers/ConciliacionUploadModal.tsx
import { useState, useRef } from 'react';
import formStyles from '../../components/ui/FormModal.module.css';
import tabStyles from './ValesTabs.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const ConciliacionUploadModal = ({ isOpen, onClose, onUpload, isLoading }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const valid = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!valid.includes(f.type) && !f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (file) onUpload(file);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={formStyles.overlay} onClick={handleClose}>
      <div className={formStyles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-upload"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Nueva conciliación</h3>
              <p className={formStyles.modalSubtitle}>
                Sube el Excel del proveedor para cruzar con tus vales
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className={formStyles.formBody}>
          {!file ? (
            <>
              <div
                className={`${tabStyles.fileUploadArea} ${isDragging ? tabStyles.fileUploadAreaActive : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <i className={`bx bx-cloud-upload ${tabStyles.fileUploadIcon}`}></i>
                <span className={tabStyles.fileUploadText}>
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </span>
                <span className={tabStyles.fileUploadHint}>
                  Formatos aceptados: .xlsx, .xls
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </>
          ) : (
            <div className={tabStyles.fileSelected}>
              <i className={`bx bx-file ${tabStyles.fileSelectedIcon}`}></i>
              <div className={tabStyles.fileSelectedInfo}>
                <div className={tabStyles.fileSelectedName}>{file.name}</div>
                <div className={tabStyles.fileSelectedSize}>{formatSize(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className={tabStyles.fileSelectedRemove}
                disabled={isLoading}
              >
                <i className="bx bx-trash"></i>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={formStyles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={formStyles.cancelBtn}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={formStyles.submitBtn}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Procesando...</>
            ) : (
              <><i className="bx bx-check-double"></i> Conciliar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};