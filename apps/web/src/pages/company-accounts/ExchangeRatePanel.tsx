import { useState, useEffect } from 'react';
import styles from './ExchangeRatePanel.module.css';

interface Props {
  uniqueDates: string[];
  ratesMap: Map<string, number>;
  onSaveBatch: (rates: { date: string; rate: number }[]) => void;
  onSaveSingle: (date: string, rate: number) => void;
}

const formatDateShort = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const ExchangeRatePanel = ({ uniqueDates, ratesMap, onSaveBatch, onSaveSingle }: Props) => {
  const [localRates, setLocalRates] = useState<Record<string, string>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sincronizar con ratesMap cuando cambia
  useEffect(() => {
    const initial: Record<string, string> = {};
    uniqueDates.forEach(d => {
      initial[d] = ratesMap.get(d)?.toString() || '';
    });
    setLocalRates(initial);
  }, [uniqueDates, ratesMap]);

  const handleChange = (date: string, value: string) => {
    // Solo permitir números y punto decimal
    if (value && !/^\d*\.?\d{0,4}$/.test(value)) return;
    setLocalRates(prev => ({ ...prev, [date]: value }));
  };

  const handleBlurSingle = (date: string) => {
    const val = parseFloat(localRates[date]);
    if (!val || val <= 0) return;
    const existing = ratesMap.get(date);
    if (existing !== val) {
      onSaveSingle(date, val);
    }
  };

  const handleApplyToAll = () => {
    // Tomar el primer valor con dato y aplicar a todos los vacíos
    const firstRate = Object.values(localRates).find(v => parseFloat(v) > 0);
    if (!firstRate) return;

    const updated = { ...localRates };
    uniqueDates.forEach(d => {
      if (!updated[d] || updated[d] === '') {
        updated[d] = firstRate;
      }
    });
    setLocalRates(updated);
  };

  const handleSaveAll = () => {
    const batch = Object.entries(localRates)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([date, v]) => ({ date, rate: parseFloat(v) }));

    if (batch.length === 0) return;
    onSaveBatch(batch);
  };

  const filledCount = Object.values(localRates).filter(v => parseFloat(v) > 0).length;
  const totalCount = uniqueDates.length;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className={styles.panelTitle}>
          <i className="bx bx-transfer-alt"></i>
          <span>Tipo de Cambio (USD → PEN)</span>
          <span className={styles.panelCount}>
            {filledCount}/{totalCount} fechas
          </span>
        </div>
        <i className={`bx ${isCollapsed ? 'bx-chevron-down' : 'bx-chevron-up'}`}></i>
      </div>

      {!isCollapsed && (
        <>
          <div className={styles.panelActions}>
            <button
              className={styles.smallButton}
              onClick={handleApplyToAll}
              title="Copia el primer TC a todas las fechas vacías"
            >
              <i className="bx bx-copy"></i>
              Aplicar a vacíos
            </button>
            <button
              className={`${styles.smallButton} ${styles.smallButtonPrimary}`}
              onClick={handleSaveAll}
            >
              <i className="bx bx-save"></i>
              Guardar todos
            </button>
          </div>

          <div className={styles.ratesList}>
            {uniqueDates.map(date => {
              const saved = ratesMap.has(date);
              return (
                <div key={date} className={styles.rateRow}>
                  <span className={styles.rateDate}>{formatDateShort(date)}</span>
                  <div className={styles.rateInputWrapper}>
                    <span className={styles.ratePrefix}>S/</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`${styles.rateInput} ${saved ? styles.rateInputSaved : ''}`}
                      value={localRates[date] || ''}
                      onChange={e => handleChange(date, e.target.value)}
                      onBlur={() => handleBlurSingle(date)}
                      placeholder="0.0000"
                    />
                    {saved && <i className={`bx bx-check ${styles.rateCheck}`}></i>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};