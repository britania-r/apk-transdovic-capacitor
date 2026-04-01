// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/PrecintosTab.tsx
import { useState, useEffect } from 'react';
import type { WaypointCollection, WaypointCollectionInput } from '../../hooks/useWaypointCollection';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  collection: WaypointCollection | null | undefined;
  onSave: (input: WaypointCollectionInput) => Promise<any>;
  isSaving: boolean;
  isCompleted: boolean;
}

export const PrecintosTab = ({ collection, onSave, isSaving, isCompleted }: Props) => {
  const [precInreso, setPrecIngreso] = useState('');
  const [precSalida, setPrecSalida] = useState('');
  const [saldo, setSaldo] = useState('');

  useEffect(() => {
    if (collection) {
      setPrecIngreso(collection.precinto_ingreso || '');
      setPrecSalida(collection.precinto_salida || '');
      setSaldo(collection.saldo?.toString() || '');
    }
  }, [collection]);

  const handleSave = async () => {
    await onSave({
      precinto_ingreso: precInreso || undefined,
      precinto_salida: precSalida || undefined,
      saldo: saldo ? Number(saldo) : null,
    });
  };

  const disabled = isCompleted;

  return (
    <div className={styles.tabPanel}>
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-lock-alt"></i> Precintos
        </h3>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Precinto de ingreso</label>
            <input
              type="text"
              inputMode="numeric"
              value={precInreso}
              onChange={e => setPrecIngreso(e.target.value)}
              className={styles.fieldInput}
              placeholder="Número de precinto"
              disabled={disabled}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Precinto de salida</label>
            <input
              type="text"
              inputMode="numeric"
              value={precSalida}
              onChange={e => setPrecSalida(e.target.value)}
              className={styles.fieldInput}
              placeholder="Número de precinto"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <i className="bx bx-droplet"></i> Saldo restante
        </h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Saldo (L)</label>
          <input
            type="number"
            inputMode="decimal"
            value={saldo}
            onChange={e => setSaldo(e.target.value)}
            className={styles.fieldInput}
            placeholder="Litros restantes"
            disabled={disabled}
          />
        </div>
      </div>

      {!disabled && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveBtn}
        >
          {isSaving ? (
            <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
          ) : (
            <><i className="bx bx-save"></i> Guardar precintos</>
          )}
        </button>
      )}
    </div>
  );
};