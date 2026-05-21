// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/TankForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTankConversion } from '../../hooks/useTankConversion';
import { PhotoCapture } from './PhotoCapture';
import type { FarmTankWithType, TankReading, TankReadingInput } from '../../hooks/useTankReadings';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  tank: FarmTankWithType;
  reading: TankReading | undefined;
  collectionId: string | undefined;
  isCompleted: boolean;
  onSave: (input: TankReadingInput) => Promise<void>;
  isSaving: boolean;
  routeId: string;
  waypointId: string;
  plate: string;
  driverName: string;
  farmName: string;
}

const FACTOR = 1.03;

/** Convierte CM y MM separados a un valor decimal unificado: "7.8" */
const toUnifiedReglaje = (cm: number | null, mm: number | null): string => {
  if (cm === null && mm === null) return '';
  if (cm === null) return `0.${mm ?? 0}`;
  if (mm === null) return `${cm}`;
  return `${cm}.${mm}`;
};

/** Separa un valor decimal "7.8" en { cm: 7, mm: 8 } */
const parseUnifiedReglaje = (value: string): { cm: number | null; mm: number | null } => {
  if (!value || value === '') return { cm: null, mm: null };

  const parts = value.split('.');
  const cm = parts[0] ? parseInt(parts[0], 10) : 0;
  const mm = parts[1] ? parseInt(parts[1].charAt(0), 10) : 0;

  return {
    cm: isNaN(cm) ? null : cm,
    mm: isNaN(mm) ? null : mm,
  };
};

export const TankForm = ({
  tank, reading, collectionId, isCompleted, onSave, isSaving,
  routeId, waypointId, plate, driverName, farmName,
}: Props) => {
  const { lookup, isSearching, error: conversionError } = useTankConversion();
  const hasTable = !!tank.conversion_type;

  const [isDirectMode, setIsDirectMode] = useState(false);
  const [manualReglageMode, setManualReglageMode] = useState<'decimal' | 'integer'>('decimal');

  // Campo unificado de reglaje (para tipo decimal: "7.8")
  const [reglaje, setReglaje] = useState('');
  // Campo MM (para tipo integer)
  const [readingMm, setReadingMm] = useState('');

  const [tableLiters, setTableLiters] = useState('');
  const [manualLiters, setManualLiters] = useState('');
  const [kgDirect, setKgDirect] = useState('');
  const [temperature, setTemperature] = useState('');
  const [labAuthorized, setLabAuthorized] = useState<boolean | null>(null);
  const [observation, setObservation] = useState('');
  const [photoFile, setPhotoFile] = useState<string | null>(null);

  const litersValue = tableLiters ? Number(tableLiters) : (manualLiters ? Number(manualLiters) : 0);
  const kgCalculated = litersValue > 0 ? (litersValue * FACTOR).toFixed(2) : '';

  const tempValue = temperature ? Number(temperature) : null;
  const needsLabAuth = tempValue !== null && tempValue > 4;

  const showDecimalFields = hasTable
    ? tank.conversion_type === 'decimal'
    : manualReglageMode === 'decimal';

  // Inicializar desde reading existente
  useEffect(() => {
    if (reading) {
      if (reading.reading_cm !== null || (hasTable && tank.conversion_type === 'decimal') || (!hasTable && reading.reading_cm !== null)) {
        setReglaje(toUnifiedReglaje(reading.reading_cm, reading.reading_mm));
      }
      setReadingMm(reading.reading_mm?.toString() || '');
      setTableLiters(reading.table_liters?.toString() || '');
      setManualLiters(reading.manual_liters?.toString() || '');
      setKgDirect(reading.kg_direct?.toString() || '');
      setTemperature(reading.temperature?.toString() || '');
      setLabAuthorized(reading.lab_authorized);
      setObservation(reading.observation || '');
      setPhotoFile(reading.photo_file || null);
      setIsDirectMode(!!reading.kg_direct);

      if (!hasTable) {
        setManualReglageMode(reading.reading_cm !== null ? 'decimal' : 'integer');
      }
    }
  }, [reading, hasTable, tank.conversion_type]);

  useEffect(() => {
    if (needsLabAuth && labAuthorized === null) {
      setLabAuthorized(true);
    }
  }, [needsLabAuth, labAuthorized]);

  // Extraer CM y MM del campo unificado para la búsqueda
  const parsedReglaje = parseUnifiedReglaje(reglaje);

  // Búsqueda en tabla de conversión
  const handleLookup = useCallback(async () => {
    if (!hasTable || !tank.conversion_type) return;

    if (tank.conversion_type === 'decimal') {
      const { cm, mm } = parseUnifiedReglaje(reglaje);
      if (cm === null || mm === null) return;
      const result = await lookup(tank.id, 'decimal', { cm, mm });
      setTableLiters(result !== null ? result.toString() : '');
    } else {
      const mm = Number(readingMm);
      if (isNaN(mm) || mm < 0) return;
      const result = await lookup(tank.id, 'integer', { mm });
      setTableLiters(result !== null ? result.toString() : '');
    }
  }, [tank, reglaje, readingMm, lookup, hasTable]);

  // Auto-buscar cuando cambian los valores
  useEffect(() => {
    if (!hasTable || isDirectMode) return;

    const timer = setTimeout(() => {
      if (tank.conversion_type === 'decimal' && reglaje && reglaje.includes('.')) {
        handleLookup();
      } else if (tank.conversion_type === 'integer' && readingMm) {
        handleLookup();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [reglaje, readingMm, tank.conversion_type, isDirectMode, handleLookup, hasTable]);

  // Validar input del campo unificado: solo un decimal, un dígito después del punto
  const handleReglajeChange = (value: string) => {
    // Permitir vacío
    if (value === '') { setReglaje(''); return; }
    // Permitir solo dígitos y un punto
    if (/^\d*\.?\d?$/.test(value)) {
      setReglaje(value);
    }
  };

  // Guardar
  const handleSave = async () => {
    let saveCm: number | null = null;
    let saveMm: number | null = null;

    if (showDecimalFields) {
      const parsed = parseUnifiedReglaje(reglaje);
      saveCm = parsed.cm;
      saveMm = parsed.mm;
    } else {
      saveMm = readingMm ? Number(readingMm) : null;
    }

    const input: TankReadingInput = {
      reading_cm: saveCm,
      reading_mm: saveMm,
      table_liters: tableLiters ? Number(tableLiters) : null,
      manual_liters: manualLiters ? Number(manualLiters) : null,
      factor: FACTOR,
      kg: kgCalculated ? Number(kgCalculated) : null,
      kg_direct: kgDirect ? Number(kgDirect) : null,
      temperature: temperature ? Number(temperature) : null,
      lab_authorized: needsLabAuth ? labAuthorized : null,
      observation: observation || null,
      photo_file: photoFile,
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
        <>
          {/* Toggle de modo reglaje (solo si NO tiene tabla) */}
          {!hasTable && (
            <div className={styles.formSection}>
              <div className={styles.noTableNotice}>
                <i className="bx bx-info-circle"></i>
                <span>Sin tabla de conversión — Ingreso manual</span>
              </div>
              <div className={styles.modeToggle}>
                <button
                  onClick={() => setManualReglageMode('decimal')}
                  className={`${styles.modeBtn} ${manualReglageMode === 'decimal' ? styles.modeBtnActive : ''}`}
                  disabled={disabled}
                >
                  CM.MM
                </button>
                <button
                  onClick={() => setManualReglageMode('integer')}
                  className={`${styles.modeBtn} ${manualReglageMode === 'integer' ? styles.modeBtnActive : ''}`}
                  disabled={disabled}
                >
                  Solo MM
                </button>
              </div>
            </div>
          )}

          {/* Reglaje */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Reglaje (R)</h3>

            {showDecimalFields ? (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>CM.MM</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={reglaje}
                  onChange={e => handleReglajeChange(e.target.value)}
                  className={styles.fieldInput}
                  placeholder="Ej: 7.8"
                  disabled={disabled}
                />
                {reglaje && (
                  <span className={styles.fieldHint}>
                    CM: {parsedReglaje.cm ?? 0} — MM: {parsedReglaje.mm ?? 0}
                  </span>
                )}
              </div>
            ) : (
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
          </div>

          {/* Litros */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Litros (L)</h3>

            {hasTable ? (
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
                  {!tableLiters && reglaje && !isSearching && (
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

          {/* Factor + KG */}
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

      {/* Foto */}
      <PhotoCapture
        existingPhoto={photoFile}
        routeId={routeId}
        waypointId={waypointId}
        tankId={tank.id}
        plate={plate}
        driverName={driverName}
        farmName={farmName}
        onPhotoUploaded={(path) => setPhotoFile(path)}
        onPhotoRemoved={() => setPhotoFile(null)}
        disabled={disabled}
      />

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