import { useState, useEffect } from 'react';
import type { LedgerRow } from '../../hooks/useAccountStatement';
import styles from './ExchangeRateOverrideModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: LedgerRow | null;
  dayRate: number | null; // TC del día (de exchange_rates)
  onSave: (transactionId: string, rate: number | null) => void;
}

const formatMoney = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-PE';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const ExchangeRateOverrideModal = ({ isOpen, onClose, transaction, dayRate, onSave }: Props) => {
  const [localRate, setLocalRate] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (transaction) {
      const hasOverride = transaction.exchange_rate_override != null;
      setUseCustom(hasOverride);
      setLocalRate(hasOverride ? transaction.exchange_rate_override!.toString() : '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const effectiveRate = useCustom ? parseFloat(localRate) || 0 : (dayRate || 0);
  const neto = transaction.haber - transaction.debe;

  const handleSave = () => {
    if (useCustom) {
      const rate = parseFloat(localRate);
      if (!rate || rate <= 0) return;
      onSave(transaction.id, rate);
    } else {
      // Quitar override → vuelve al TC del día
      onSave(transaction.id, null);
    }
    onClose();
  };

  const handleRateChange = (value: string) => {
    if (value && !/^\d*\.?\d{0,4}$/.test(value)) return;
    setLocalRate(value);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <i className="bx bx-transfer-alt"></i>
            <span>Tipo de Cambio — Transacción</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Info de la transacción */}
        <div className={styles.txInfo}>
          <div className={styles.txRow}>
            <span className={styles.txLabel}>Fecha</span>
            <span className={styles.txValue}>{formatDate(transaction.transaction_date)}</span>
          </div>
          <div className={styles.txRow}>
            <span className={styles.txLabel}>Descripción</span>
            <span className={styles.txValue}>{transaction.description || 'Sin descripción'}</span>
          </div>
          <div className={styles.txRow}>
            <span className={styles.txLabel}>Monto</span>
            <span className={styles.txValue}>
              {transaction.debe > 0 && (
                <span className={styles.montoRed}>-{formatMoney(transaction.debe, 'USD')}</span>
              )}
              {transaction.haber > 0 && (
                <span className={styles.montoGreen}>+{formatMoney(transaction.haber, 'USD')}</span>
              )}
            </span>
          </div>
          {transaction.movement_number && (
            <div className={styles.txRow}>
              <span className={styles.txLabel}>N° Mov.</span>
              <span className={styles.txValueMono}>{transaction.movement_number}</span>
            </div>
          )}
        </div>

        {/* Selector de TC */}
        <div className={styles.rateSection}>
          {/* Opción 1: TC del día */}
          <label
            className={`${styles.rateOption} ${!useCustom ? styles.rateOptionActive : ''}`}
            onClick={() => setUseCustom(false)}
          >
            <input
              type="radio"
              checked={!useCustom}
              onChange={() => setUseCustom(false)}
              className={styles.radio}
            />
            <div className={styles.rateOptionContent}>
              <span className={styles.rateOptionTitle}>TC del día</span>
              <span className={styles.rateOptionValue}>
                {dayRate ? `S/ ${dayRate.toFixed(4)}` : 'No definido'}
              </span>
            </div>
          </label>

          {/* Opción 2: TC personalizado */}
          <label
            className={`${styles.rateOption} ${useCustom ? styles.rateOptionActive : ''}`}
            onClick={() => setUseCustom(true)}
          >
            <input
              type="radio"
              checked={useCustom}
              onChange={() => setUseCustom(true)}
              className={styles.radio}
            />
            <div className={styles.rateOptionContent}>
              <span className={styles.rateOptionTitle}>TC personalizado</span>
              {useCustom && (
                <div className={styles.customInputWrapper}>
                  <span className={styles.customPrefix}>S/</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.customInput}
                    value={localRate}
                    onChange={e => handleRateChange(e.target.value)}
                    placeholder="0.0000"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Preview de conversión */}
        {effectiveRate > 0 && (
          <div className={styles.preview}>
            <span className={styles.previewLabel}>Equivalente en soles:</span>
            <span className={styles.previewValue}>
              {formatMoney(Math.abs(neto) * effectiveRate, 'PEN')}
            </span>
            <span className={styles.previewCalc}>
              ({formatMoney(Math.abs(neto), 'USD')} × {effectiveRate.toFixed(4)})
            </span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={useCustom && (!parseFloat(localRate) || parseFloat(localRate) <= 0)}
          >
            <i className="bx bx-check"></i>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};