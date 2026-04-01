// File: apps/web/src/pages/purchases/PurchaseItemsTable.tsx
import type { PurchaseOrderItem } from './PurchasesDetailsPage';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './PurchaseItemsTable.module.css';

interface Props {
  items: PurchaseOrderItem[];
  canEdit: boolean;
  onEdit: (item: PurchaseOrderItem) => void;
  onDelete: (item: PurchaseOrderItem) => void;
  onEditExpiration: (item: PurchaseOrderItem) => void;
}

const formatCurrency = (amount: number, currency = 'PEN') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const getItemDescription = (item: PurchaseOrderItem): { main: string; sub?: string } => {
  if (item.product_name) return { main: item.product_name, sub: item.product_code || undefined };
  if (item.service_description) return { main: item.service_description };
  if (item.service_name && item.vehicle_plate) return { main: `Servicio: ${item.service_name}`, sub: `Vehículo: ${item.vehicle_plate}` };
  if (item.first_aid_item_name && item.vehicle_plate) return { main: `Botiquín: ${item.first_aid_item_name}`, sub: `Vehículo: ${item.vehicle_plate}` };
  if (item.vehicle_plate) return { main: `Vehículo: ${item.vehicle_plate}` };
  return { main: 'Ítem genérico' };
};

const getItemDetails = (item: PurchaseOrderItem): string => {
  const parts: string[] = [];
  if (item.manual_code) parts.push(`Cód: ${item.manual_code}`);
  if (item.details) parts.push(item.details);
  if (item.expiration_date) {
    const date = new Date(item.expiration_date);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    parts.push(`Vence: ${utcDate.toLocaleDateString('es-PE')}`);
  }
  return parts.join(' · ') || '—';
};

const hasExpiration = (item: PurchaseOrderItem): boolean => {
  return !!(item.vehicle_id || item.first_aid_item_id);
};

export const PurchaseItemsTable = ({ items, canEdit, onEdit, onDelete, onEditExpiration }: Props) => {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-list-ul"></i>
        <span>Aún no se han agregado ítems a esta orden</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Detalles</th>
              <th>Cant.</th>
              <th>P. Unit.</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const desc = getItemDescription(item);
              return (
                <tr key={item.id}>
                  <td>
                    <div className={tableStyles.userInfo}>
                      <span className={tableStyles.userName}>{desc.main}</span>
                      {desc.sub && <span className={tableStyles.userEmail}>{desc.sub}</span>}
                    </div>
                  </td>
                  <td className={styles.detailsCell}>{getItemDetails(item)}</td>
                  <td className={styles.numCell}>{item.quantity}</td>
                  <td className={styles.numCell}>{formatCurrency(item.unit_price, item.currency)}</td>
                  <td className={styles.numCell}>{formatCurrency(item.subtotal, item.currency)}</td>
                  <td>
                    <div className={tableStyles.actions}>
                      {hasExpiration(item) && (
                        <button
                          onClick={() => onEditExpiration(item)}
                          className={`${tableStyles.actionBtn} ${styles.expirationBtn}`}
                          title="Editar vencimiento"
                        >
                          <i className="bx bx-calendar-edit"></i>
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => onEdit(item)}
                            className={`${tableStyles.actionBtn} ${tableStyles.editBtn}`}
                            title="Editar"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className={`${tableStyles.actionBtn} ${tableStyles.deleteBtn}`}
                            title="Eliminar"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={tableStyles.cardList}>
        {items.map(item => {
          const desc = getItemDescription(item);
          return (
            <div key={item.id} className={tableStyles.card}>
              <div className={tableStyles.cardTop}>
                <div className={tableStyles.userInfo}>
                  <span className={tableStyles.userName}>{desc.main}</span>
                  {desc.sub && <span className={tableStyles.userEmail}>{desc.sub}</span>}
                </div>
                <span className={styles.cardSubtotal}>
                  {formatCurrency(item.subtotal, item.currency)}
                </span>
              </div>

              <div className={tableStyles.cardMeta}>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Cantidad</span>
                  <span className={tableStyles.metaValue}>{item.quantity}</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>P. Unit.</span>
                  <span className={tableStyles.metaValue}>{formatCurrency(item.unit_price, item.currency)}</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Detalles</span>
                  <span className={tableStyles.metaValue}>{getItemDetails(item)}</span>
                </div>
              </div>

              <div className={tableStyles.cardActions}>
                {hasExpiration(item) && (
                  <button onClick={() => onEditExpiration(item)} className={`${tableStyles.cardBtn} ${styles.expirationBtnCard}`}>
                    <i className="bx bx-calendar-edit"></i> Vencimiento
                  </button>
                )}
                {canEdit && (
                  <>
                    <button onClick={() => onEdit(item)} className={`${tableStyles.cardBtn} ${tableStyles.editBtn}`}>
                      <i className="bx bx-pencil"></i> Editar
                    </button>
                    <button onClick={() => onDelete(item)} className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}>
                      <i className="bx bx-trash"></i> Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};