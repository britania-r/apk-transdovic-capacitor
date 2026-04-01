// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/TankForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTankConversion } from '../../hooks/useTankConversion';
import type { FarmTankWithType, TankReading, TankReadingInput } from '../../hooks/useTankReadings';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  tank: FarmTankWithType;
  reading: TankReading | undefined;
  collectionId: string | undefined;
  isCompleted: boolean;
  onSave: (input: TankReadingInput) => Promise<void>;
  isSaving: boolean;
}

const FACTOR = 1.03;

export const TankForm = ({ tank, reading, collectionId, isCompleted, onSave, isSaving }: Props) => {
  const { lookup, isSearching, error: conversionError } = useTankConversion();

  // Modo: normal (reglaje + tabla) o directo (kg directo)
  const [isDirectMode, setIsDirectMode] = useState(false);

  // Campos
  const [readingCm, setReadingCm] = useState('');
  const [readingMm, setReadingMm] = useState('');
  const [tableLiters, setTableLiters] = useState('');
  const [manualLiters, setManualLiters] = useState('');
  const [kgDirect, setKgDirect] = useState('');
  const [temperature, setTemperature] = useState('');
  const [labAuthorized, setLabAuthorized] = useState<boolean | null>(null);
  const [observation, setObservation] = useState('');
  const [saldo, setSaldo] = useState('');

  // KG calculado
  const litersValue = tableLiters ? Number(tableLiters) : (manualLiters ? Number(manualLiters) : 0);
  const kgCalculated = litersValue > 0 ? (litersValue * FACTOR).toFixed(2) : '';

  // Temp > 4°C requiere autorización
  const tempValue = temperature ? Number(temperature) : null;
  const needsLabAuth = tempValue !== null && tempValue > 4;

  // Inicializar desde reading existente
  useEffect(() => {
    if (reading) {
      setReadingCm(reading.reading_cm?.toString() || '');
      setReadingMm(reading.reading_mm?.toString() || '');
      setTableLiters(reading.table_liters?.toString() || '');
      setManualLiters(reading.manual_liters?.toString() || '');
      setKgDirect(reading.kg_direct?.toString() || '');
      setTemperature(reading.temperature?.toString() || '');
      setLabAuthorized(reading.lab_authorized);
      setObservation(reading.observation || '');
      setIsDirectMode(!!reading.kg_direct);
    }
  }, [reading]);

  // Búsqueda en tabla de conversión cuando cambian los valores de reglaje
  const handleLookup = useCallback(async () => {
    if (!tank.conversion_type) return;

    const mm = Number(readingMm);
    if (isNaN(mm) || mm < 0) return;

    if (tank.conversion_type === 'decimal') {
      const cm = Number(readingCm);
      if (isNaN(cm) || cm < 0) return;
      const result = await lookup(tank.id, 'decimal', { cm, mm });
      if (result !== null) {
        setTableLiters(result.toString());
      } else {
        setTableLiters('');
      }
    } else {
      const result = await lookup(tank.id, 'integer', { mm });
      if (result !== null) {
        setTableLiters(result.toString());
      } else {
        setTableLiters('');
      }
    }
  }, [tank, readingCm, readingMm, lookup]);

  // Auto-buscar cuando cambian los valores
  useEffect(() => {
    if (!tank.conversion_type || isDirectMode) return;

    const timer = setTimeout(() => {
      if (tank.conversion_type === 'decimal' && readingCm && readingMm) {
        handleLookup();
      } else if (tank.conversion_type === 'integer' && readingMm) {
        handleLookup();
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [readingCm, readingMm, tank.conversion_type, isDirectMode, handleLookup]);

  // Guardar
  const handleSave = async () => {
    const input: TankReadingInput = {
      reading_cm: readingCm ? Number(readingCm) : null,
      reading_mm: readingMm ? Number(readingMm) : null,
      table_liters: tableLiters ? Number(tableLiters) : null,
      manual_liters: manualLiters ? Number(manualLiters) : null,
      factor: FACTOR,
      kg: kgCalculated ? Number(kgCalculated) : null,
      kg_direct: kgDirect ? Number(kgDirect) : null,
      temperature: temperature ? Number(temperature) : null,
      lab_authorized: needsLabAuth ? labAuthorized : null,
      observation: observation || null,
    };
    await onSave(input);
  };

  const disabled = isCompleted;

  return (
    <div className={styles.tankForm}>
      {/* Toggle modo directo */}
      <div className={styles.modeToggle}>
        <button
          onClick={() => setIsDirectMode(false)}
          className={`${styles.modeBtn} ${!isDirectMode ? styles.modeBtnActive : ''}`}
          disabled={disabled}
        >
          <i className="bx bx-calculator"></i> Calcular KG
        </button>
        <button
          onClick={() => setIsDirectMode(true)}
          className={`${styles.modeBtn} ${isDirectMode ? styles.modeBtnActive : ''}`}
          disabled={disabled}
        >
          <i className="bx bx-edit"></i> KG directo
        </button>
      </div>

      {isDirectMode ? (
        /* ── Modo directo ── */
        <div className={styles.formSection}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>KG (directo)</label>
            <input
              type="number"
              inputMode="decimal"
              value={kgDirect}
              onChange={e => setKgDirect(e.target.value)}
              className={styles.fieldInput}
              placeholder="Ingresar KG"
              disabled={disabled}
            />
          </div>
        </div>
      ) : (
        /* ── Modo cálculo ── */
        <>
          {/* Reglaje */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Reglaje (R)</h3>

            {tank.conversion_type === 'decimal' && (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>CM</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={readingCm}
                    onChange={e => setReadingCm(e.target.value)}
                    className={styles.fieldInput}
                    placeholder="0"
                    disabled={disabled}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>MM</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={readingMm}
                    onChange={e => setReadingMm(e.target.value)}
                    className={styles.fieldInput}
                    placeholder="0"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {tank.conversion_type === 'integer' && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>MM</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={readingMm}
                  onChange={e => setReadingMm(e.target.value)}
                  className={styles.fieldInput}
                  placeholder="0"
                  disabled={disabled}
                />
              </div>
            )}

            {!tank.conversion_type && (
              <div className={styles.noTableNotice}>
                <i className="bx bx-info-circle"></i>
                <span>Este tanque no tiene tabla de conversión. Ingresa los litros manualmente.</span>
              </div>
            )}
          </div>

          {/* Resultado tabla / manual */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Tabla (L)</h3>

            {tank.conversion_type ? (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Litros (tabla)</label>
                  <div className={styles.resultField}>
                    {isSearching ? (
                      <i className="bx bx-loader-alt bx-spin"></i>
                    ) : (
                      <span>{tableLiters || '—'}</span>
                    )}
                  </div>
                  {conversionError && (
                    <span className={styles.fieldError}>{conversionError}</span>
                  )}
                  {!tableLiters && readingMm && !isSearching && (
                    <span className={styles.fieldWarning}>No se encontró en la tabla</span>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Litros (manual)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={manualLiters}
                  onChange={e => setManualLiters(e.target.value)}
                  className={styles.fieldInput}
                  placeholder="Ingresar litros"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* Factor + KG calculado */}
          <div className={styles.formSection}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Factor</label>
                <div className={styles.resultField}>
                  <span>{FACTOR}</span>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>KG</label>
                <div className={`${styles.resultField} ${styles.resultHighlight}`}>
                  <span>{kgCalculated || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Temperatura */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Temperatura</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Temp (°C)</label>
          <input
            type="number"
            inputMode="decimal"
            value={temperature}
            onChange={e => setTemperature(e.target.value)}
            className={`${styles.fieldInput} ${needsLabAuth ? styles.fieldInputWarning : ''}`}
            placeholder="0.0"
            disabled={disabled}
          />
        </div>

        {needsLabAuth && (
          <div className={styles.labAuthSection}>
            <div className={styles.labAuthWarning}>
              <i className="bx bx-error"></i>
              <span>Temperatura superior a 4°C — Requiere autorización de laboratorio</span>
            </div>
            <div className={styles.labAuthButtons}>
              <button
                onClick={() => setLabAuthorized(true)}
                className={`${styles.labAuthBtn} ${labAuthorized === true ? styles.labAuthBtnYes : ''}`}
                disabled={disabled}
              >
                <i className="bx bx-check"></i> Sí, autorizado
              </button>
              <button
                onClick={() => setLabAuthorized(false)}
                className={`${styles.labAuthBtn} ${labAuthorized === false ? styles.labAuthBtnNo : ''}`}
                disabled={disabled}
              >
                <i className="bx bx-x"></i> No autorizado
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Observación */}
      <div className={styles.formSection}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Observaciones</label>
          <textarea
            value={observation}
            onChange={e => setObservation(e.target.value)}
            className={styles.fieldTextarea}
            placeholder="Notas sobre este tanque..."
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Guardar */}
      {!disabled && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveBtn}
        >
          {isSaving ? (
            <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
          ) : (
            <><i className="bx bx-save"></i> Guardar datos</>
          )}
        </button>
      )}
    </div>
  );
};