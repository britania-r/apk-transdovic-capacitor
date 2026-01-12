// File: apps/web/src/pages/purchases/PurchaseOrdersTable.tsx

import { Link } from 'react-router-dom';
import type { PurchaseOrderInList } from './PurchasesPage';
import styles from '../users/UserTable.module.css';
import statusStyles from './StatusBadge.module.css';
// --- CAMBIO: Importamos nuestro nuevo helper ---
import { handlePrintPurchaseOrder } from '../../utils/pdfUtils';

// Nota: Asegúrate de que tu tipo 'PurchaseOrderInList' en 'PurchasesPage.tsx'
// ahora incluya 'invoice_number: string | null;'

const StatusBadge = ({ status }: { status: string }) => {
  // Aseguramos que el StatusBadge maneje todos los estados del ENUM
  const statusClass = {
    'REQUERIMIENTO': statusStyles.info, 'COTIZACIÓN': statusStyles.info,
    'PENDIENTE': statusStyles.pending, 'ORDEN DE COMPRA': statusStyles.inProgress, 'ORDEN DE SERVICIO': statusStyles.inProgress,
    'AC INCONFORME': statusStyles.error, 'ACTA DE CONFORMIDAD': statusStyles.success,
    'PAGO PENDIENTE': statusStyles.warning, 'FACTURA PAGADA': statusStyles.completed,
  }[status] || statusStyles.default;
  return <span className={`${statusStyles.badge} ${statusClass}`}>{status.replace(/_/g, ' ')}</span>;
};

interface Props {
  orders: PurchaseOrderInList[];
  onDelete: (order: PurchaseOrderInList) => void;
}

export const PurchaseOrdersTable = ({ orders, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            {/* --- CAMBIO: Nueva columna --- */}
            <th>N° Factura</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.order_code}</td>
              <td>{order.supplier_name}</td>
              <td>{new Date(order.order_date).toLocaleDateString('es-PE')}</td>
              {/* --- CAMBIO: Nuevo campo --- */}
              <td>{order.invoice_number || '-'}</td>
              <td><StatusBadge status={order.status} /></td>
              <td>S/ {Number(order.total_amount).toFixed(2)}</td>
              <td>
                <div className={styles.actions}>
                  <Link to={`/purchases/${order.id}`} className={`${styles.actionButton} ${styles.detailsButton}`} title="Ver Detalles"><i className='bx bx-show'></i></Link>
                  {/* --- CAMBIO: El botón de editar ha sido eliminado --- */}
                  
                  {/* --- CAMBIO: El botón de PDF ahora llama a nuestro helper --- */}
                  <button onClick={() => handlePrintPurchaseOrder(order.id)} className={`${styles.actionButton} ${styles.pdfButton}`} title="Generar PDF"><i className='bx bxs-file-pdf'></i></button>
                  
                  <button onClick={() => onDelete(order)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Orden"><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};