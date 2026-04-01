// File: apps/web/src/pages/purchases/PurchaseOrdersTable.tsx
import { Link } from 'react-router-dom';
import type { PurchaseOrderInList } from './PurchasesPage';
import { handlePrintPurchaseOrder } from '../../utils/pdfUtils';
import styles from '../../components/ui/Table.module.css';
import localStyles from './PurchaseOrdersTable.module.css';

interface Props {
  orders: PurchaseOrderInList[];
  onDelete: (order: PurchaseOrderInList) => void;
}

const STATUS_STYLES: Record<string, string> = {
  'REQUERIMIENTO':        localStyles.statusInfo,
  'COTIZACIÓN':           localStyles.statusInfo,
  'PENDIENTE':            localStyles.statusPending,
  'ORDEN DE COMPRA':      localStyles.statusInProgress,
  'ORDEN DE SERVICIO':    localStyles.statusInProgress,
  'AC INCONFORME':        localStyles.statusError,
  'ACTA DE CONFORMIDAD':  localStyles.statusSuccess,
  'PAGO PENDIENTE':       localStyles.statusWarning,
  'FACTURA PAGADA':       localStyles.statusCompleted,
};

const formatCurrency = (amount: number, currency = 'PEN') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

export const PurchaseOrdersTable = ({ orders, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>N° Factura</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className={styles.monoCell}>{order.order_code}</td>

                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{order.supplier_name || '—'}</span>
                    </div>
                  </div>
                </td>

                <td>{formatDate(order.order_date)}</td>

                <td className={styles.monoCell}>
                  {order.invoice_number || '—'}
                </td>

                <td>
                  <span className={`${localStyles.statusBadge} ${STATUS_STYLES[order.status] || localStyles.statusDefault}`}>
                    {order.status}
                  </span>
                </td>

                <td className={localStyles.amountCell}>
                  {formatCurrency(order.total_amount, order.currency)}
                </td>

                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/purchases/${order.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver detalles"
                    >
                      <i className="bx bx-show"></i>
                    </Link>
                    <button
                      onClick={() => handlePrintPurchaseOrder(order.id)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Generar PDF"
                    >
                      <i className="bx bxs-file-pdf"></i>
                    </button>
                    <button
                      onClick={() => onDelete(order)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={styles.cardList}>
        {orders.map(order => (
          <div key={order.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{order.supplier_name || '—'}</span>
                  <span className={styles.userEmail}>{order.order_code}</span>
                </div>
              </div>
              <span className={localStyles.cardAmount}>
                {formatCurrency(order.total_amount, order.currency)}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Fecha</span>
                <span className={styles.metaValue}>{formatDate(order.order_date)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>N° Factura</span>
                <span className={styles.metaValue}>{order.invoice_number || '—'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Estado</span>
                <span className={`${localStyles.statusBadge} ${STATUS_STYLES[order.status] || localStyles.statusDefault}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                to={`/purchases/${order.id}`}
                className={`${styles.cardBtn} ${styles.viewBtn}`}
              >
                <i className="bx bx-show"></i> Detalles
              </Link>
              <button
                onClick={() => handlePrintPurchaseOrder(order.id)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bxs-file-pdf"></i> PDF
              </button>
              <button
                onClick={() => onDelete(order)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};