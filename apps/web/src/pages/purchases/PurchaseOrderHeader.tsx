// File: apps/web/src/pages/purchases/PurchaseOrderHeader.tsx

import { Link } from 'react-router-dom';
import styles from './PurchasesDetailsPage.module.css';
import statusStyles from './StatusBadge.module.css';
import toggleStyles from '../../styles/ToggleSwitch.module.css';

// --- CAMBIO: Importamos la función para generar el PDF ---
import { handlePrintPurchaseOrder } from '../../utils/pdfUtils';

import type { PurchaseOrderDetails } from './PurchasesDetailsPage';

const StatusBadge = ({ status }: { status: string }) => {
  const statusClass = {
    'REQUERIMIENTO': statusStyles.info, 'COTIZACIÓN': statusStyles.info,
    'PENDIENTE': statusStyles.pending, 'ORDEN DE COMPRA': statusStyles.inProgress, 'ORDEN DE SERVICIO': statusStyles.inProgress,
    'AC INCONFORME': statusStyles.error, 'ACTA DE CONFORMIDAD': statusStyles.success,
    'PAGO PENDIENTE': statusStyles.warning, 'FACTURA PAGADA': statusStyles.completed,
  }[status] || statusStyles.default;
  return <span className={`${statusStyles.badge} ${statusClass}`}>{status.replace(/_/g, ' ')}</span>;
};

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
  isIgvLoading
}: Props) => {
  const IGV_RATE = 0.18;
  const displayIgvAmount = isIgvEnabled ? Number(details.subtotal) * IGV_RATE : 0;
  const displayTotalAmount = Number(details.subtotal) + displayIgvAmount;
  
  return (
    <>
      <Link to="/purchases" className={styles.backLink}><i className='bx bx-arrow-back'></i> Volver a Compras</Link>
      
      <section className={styles.detailsCard}>
        
        <div className={styles.mainInfo}>
          <h1>{details.order_type}: {details.order_code}</h1>
          <p className={styles.legalName}>Proveedor: {details.supplier?.trade_name || 'Aún no asignado'}</p>
          
          <div className={styles.secondaryDetails}>
            <div className={styles.detailItem}><span className={styles.label}>RUC</span><span className={styles.value}>{details.supplier?.ruc || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Fecha de Orden</span><span className={styles.value}>{new Date(details.order_date).toLocaleDateString('es-PE')}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Tipo de Compra</span><span className={styles.value}>{details.purchase_type.replace(/_/g, ' ')}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Condición de Pago</span><span className={styles.value}>{details.payment_condition || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>N° de Factura</span><span className={styles.value}>{details.invoice_number || '-'}</span></div>
          </div>
        </div>
        
        <div className={styles.actionsPanel}>
          <StatusBadge status={details.status} />
          
          <div className={toggleStyles.toggleContainer} style={{ justifyContent: 'flex-end', margin: '1rem 0 0.5rem 0' }}>
            <label htmlFor="igv-toggle" className={toggleStyles.toggleLabel}>Incluir IGV (18%)</label>
            <label className={toggleStyles.switch}>
              <input
                id="igv-toggle"
                type="checkbox"
                checked={isIgvEnabled}
                onChange={(e) => onIgvToggle(e.target.checked)}
                disabled={isIgvLoading}
              />
              <span className={toggleStyles.slider}></span>
            </label>
          </div>

          <div className={styles.financialBreakdown}>
            <div className={styles.financialRow}>
              <span>Subtotal:</span>
              <span>S/ {Number(details.subtotal).toFixed(2)}</span>
            </div>
            
            {isIgvEnabled && (
              <div className={styles.financialRow}>
                <span>IGV (18%):</span>
                <span>S/ {displayIgvAmount.toFixed(2)}</span>
              </div>
            )}

            <h2 className={styles.totalAmount}>
              <span>Total:</span>
              <span>S/ {displayTotalAmount.toFixed(2)}</span>
            </h2>
          </div>
          
          <div className={styles.headerButtonContainer}>
            {/* --- CAMBIO: El onClick ahora llama a la función de impresión --- */}
            <button onClick={() => handlePrintPurchaseOrder(details.id)} className={`${styles.actionButton} ${styles.pdfButton}`} title="Generar PDF">
              <i className='bx bxs-file-pdf'></i>
            </button>
            <button onClick={onStatusChangeClick} className={styles.updateStatusButton}>Actualizar Estado</button>
          </div>
        </div>

      </section>
    </>
  );
};