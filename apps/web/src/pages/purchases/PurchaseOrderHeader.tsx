// File: apps/web/src/pages/purchases/PurchaseOrderHeader.tsx
import { Link } from 'react-router-dom';
import { handlePrintPurchaseOrder } from '../../utils/pdfUtils';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from './PurchasesDetailsPage.module.css';

const STATUS_STYLES: Record<string, string> = {
  'REQUERIMIENTO':        styles.statusInfo,
  'COTIZACIÓN':           styles.statusInfo,
  'PENDIENTE':            styles.statusPending,
  'ORDEN DE COMPRA':      styles.statusInProgress,
  'ORDEN DE SERVICIO':    styles.statusInProgress,
  'AC INCONFORME':        styles.statusError,
  'ACTA DE CONFORMIDAD':  styles.statusSuccess,
  'PAGO PENDIENTE':       styles.statusWarning,
  'FACTURA PAGADA':       styles.statusCompleted,
};

const ORDER_TYPE_OPTIONS = [
  { value: 'Orden de Compra', label: 'Orden de Compra' },
  { value: 'Orden de Servicio', label: 'Orden de Servicio y otros' },
];

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (amount: number, currency = 'PEN') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

interface Props {
  details: PurchaseOrderDetails;
  onStatusChangeClick: () => void;
  isIgvEnabled: boolean;
  onIgvToggle: (enabled: boolean) => void;
  isIgvLoading: boolean;
}

export const PurchaseOrderHeader = ({
  details,
  onStatusChangeClick,
  isIgvEnabled,
  onIgvToggle,
  isIgvLoading,
}: Props) => {
  const IGV_RATE = 0.18;
  const subtotal = Number(details.subtotal);
  const igvAmount = isIgvEnabled ? subtotal * IGV_RATE : 0;
  const totalAmount = subtotal + igvAmount;
  const currency = details.currency || 'PEN';

  return (
    <div className={styles.header}>
      {/* Top bar */}
      <div className={styles.headerTop}>
        <Link to="/purchases" className={styles.backLink}>
          <i className="bx bx-arrow-back"></i>
          Volver a compras
        </Link>
        <div className={styles.headerActions}>
          <button
            onClick={() => handlePrintPurchaseOrder(details.id)}
            className={styles.headerActionBtn}
            title="Generar PDF"
          >
            <i className="bx bxs-file-pdf"></i>
          </button>
          <button
            onClick={onStatusChangeClick}
            className={styles.statusBtn}
          >
            <i className="bx bx-refresh"></i>
            <span>Actualizar estado</span>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className={styles.headerProfile}>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>
  {details.order_type === 'Orden de Servicio' ? 'Orden de Servicio y otros' : details.order_type}: {details.order_code}
</h1>
          <span className={styles.headerSub}>
            Proveedor: {details.supplier?.trade_name || 'Aún no asignado'}
          </span>
        </div>
        <span className={`${styles.statusBadge} ${STATUS_STYLES[details.status] || styles.statusDefault}`}>
          {details.status}
        </span>
      </div>

      {/* Data grid */}
      <div className={styles.headerGrid}>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>RUC</span>
          <span className={styles.headerValue}>{details.supplier?.ruc || '—'}</span>
        </div>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Fecha</span>
          <span className={styles.headerValue}>{formatDate(details.order_date)}</span>
        </div>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Moneda</span>
          <span className={styles.headerValue}>{currency}</span>
        </div>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Condición</span>
          <span className={styles.headerValue}>{details.payment_condition || '—'}</span>
        </div>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>N° Factura</span>
          <span className={styles.headerValue}>{details.invoice_number || '—'}</span>
        </div>
        <div className={styles.headerItem}>
          <span className={styles.headerLabel}>Tipo compra</span>
          <span className={styles.headerValue}>{details.purchase_type}</span>
        </div>
      </div>

      {/* IGV toggle + financial breakdown */}
      <div className={styles.financialBar}>
        <div className={styles.igvToggle}>
          <label className={styles.toggleLabel} htmlFor="igv-toggle">
            Incluir IGV (18%)
          </label>
          <label className={styles.switch}>
            <input
              id="igv-toggle"
              type="checkbox"
              checked={isIgvEnabled}
              onChange={e => onIgvToggle(e.target.checked)}
              disabled={isIgvLoading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.financialGroup}>
          <div className={styles.financialItem}>
            <span className={styles.financialLabel}>Subtotal</span>
            <span className={styles.financialValue}>
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          {isIgvEnabled && (
            <div className={styles.financialItem}>
              <span className={styles.financialLabel}>IGV (18%)</span>
              <span className={styles.financialValue}>
                {formatCurrency(igvAmount, currency)}
              </span>
            </div>
          )}
          <div className={`${styles.financialItem} ${styles.financialTotal}`}>
            <span className={styles.financialLabel}>Total</span>
            <span className={styles.financialValue}>
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};