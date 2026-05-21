// File: apps/web/src/pages/gas-stations/TollDeleteModal.tsx
import { useState, useEffect } from 'react';
import styles from '../../components/ui/FormModal.module.css';
import mapStyles from './PeajeFormModal.module.css';

type Source = 'covisol' | 'comsatel' | 'ambos';

export interface TollDeletePayload {
  source: Source;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: TollDeletePayload) => void;
  isLoading: boolean;
}

export const TollDeleteModal = ({ isOpen, onClose, onConfirm, isLoading }: Props) => {
  const [source, setSource] = useState<Source>('ambos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSource('ambos');
      setDateFrom('');
      setDateTo('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = dateFrom && dateTo && dateFrom <= dateTo;

  const sourceLabel = source === 'ambos' ? 'COVISOL y COMSATEL' : source.toUpperCase();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon} style={{ background: 'var(--color-danger-bg, rgba(239,68,68,0.1))' }}>
              <i className="bx bx-trash" style={{ color: 'var(--color-danger)' }}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Limpiar registros</h3>
              <p className={styles.modalSubtitle}>
                Elimina registros importados por fuente y rango de fechas
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className={styles.formBody}>
          {/* Fuente */}
          <div className={styles.field}>
            <label className={styles.label}>
              Fuente <span className={styles.required}>*</span>
            </label>
            <div className={mapStyles.radioGroup} style={{ flexDirection: 'column' }}>
              <label className={`${mapStyles.radioOption} ${source === 'covisol' ? mapStyles.radioActive : ''}`}>
                <input
                  type="radio" name="delete_source" value="covisol"
                  checked={source === 'covisol'} onChange={() => setSource('covisol')}
                />
                <i className="bx bx-check-circle"></i>
                Solo COVISOL
              </label>
              <label className={`${mapStyles.radioOption} ${source === 'comsatel' ? mapStyles.radioActive : ''}`}>
                <input
                  type="radio" name="delete_source" value="comsatel"
                  checked={source === 'comsatel'} onChange={() => setSource('comsatel')}
                />
                <i className="bx bx-check-circle"></i>
                Solo COMSATEL
              </label>
              <label className={`${mapStyles.radioOption} ${source === 'ambos' ? mapStyles.radioActive : ''}`}>
                <input
                  type="radio" name="delete_source" value="ambos"
                  checked={source === 'ambos'} onChange={() => setSource('ambos')}
                />
                <i className="bx bx-check-circle"></i>
                Ambos (COVISOL + COMSATEL)
              </label>
            </div>
          </div>

          {/* Rango de fechas */}
          <div className={styles.field}>
            <label className={styles.label}>
              Desde <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Hasta <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Warning */}
          {canSubmit && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-danger-bg, rgba(239,68,68,0.08))',
              borderRadius: 'var(--radius)',
              border: '1.5px solid var(--color-danger-border, rgba(239,68,68,0.2))',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <i className="bx bx-error-circle" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              Se eliminarán todos los registros de {sourceLabel} entre {dateFrom.split('-').reverse().join('/')} y {dateTo.split('-').reverse().join('/')}. Esta acción es irreversible.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelBtn}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ source, dateFrom, dateTo })}
            className={styles.submitBtn}
            disabled={isLoading || !canSubmit}
            style={{
              background: canSubmit ? 'var(--color-danger)' : undefined,
              borderColor: canSubmit ? 'var(--color-danger)' : undefined,
            }}
          >
            {isLoading ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Eliminando...</>
            ) : (
              <><i className="bx bx-trash"></i> Eliminar registros</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};