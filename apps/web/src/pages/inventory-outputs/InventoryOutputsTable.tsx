// File: apps/web/src/pages/inventory-outputs/InventoryOutputsTable.tsx
import { Link } from 'react-router-dom';
import type { InventoryOutputInList } from './InventoryOutputsPage';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './InventoryOutputsTable.module.css';

interface Props {
  outputs: InventoryOutputInList[];
  onDelete: (o: InventoryOutputInList) => void;
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

export const InventoryOutputsTable = ({ outputs, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha / Hora</th>
              <th>Vehículo</th>
              <th>Responsable</th>
              <th>Productos</th>
              <th>Cant. Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {outputs.map(o => (
              <tr key={o.id}>
                <td className={tableStyles.monoCell}>{o.output_code}</td>
                <td>{formatDateTime(o.output_date)}</td>
                <td>
                  <span className={styles.plateBadge}>{o.vehicle_plate}</span>
                </td>
                <td>{o.responsible_name}</td>
                <td className={styles.numCell}>{o.total_items}</td>
                <td className={styles.numCell}>{o.total_quantity}</td>
                <td>
                  <div className={tableStyles.actions}>
                    <Link to={`/salidas/${o.id}`} className={`${tableStyles.actionBtn} ${tableStyles.viewBtn}`} title="Ver detalle">
                      <i className="bx bx-show"></i>
                    </Link>
                    <button onClick={() => onDelete(o)} className={`${tableStyles.actionBtn} ${tableStyles.deleteBtn}`} title="Eliminar">
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
      <div className={tableStyles.cardList}>
        {outputs.map(o => (
          <div key={o.id} className={tableStyles.card}>
            <div className={tableStyles.cardTop}>
              <div className={tableStyles.cardLeft}>
                <div className={tableStyles.userInfo}>
                  <span className={tableStyles.userName}>{o.output_code}</span>
                  <span className={tableStyles.userEmail}>{o.vehicle_plate}</span>
                </div>
              </div>
              <span className={styles.quantityBadge}>{o.total_quantity} uds</span>
            </div>
            <div className={tableStyles.cardMeta}>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Fecha</span>
                <span className={tableStyles.metaValue}>{formatDateTime(o.output_date)}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Responsable</span>
                <span className={tableStyles.metaValue}>{o.responsible_name}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Productos</span>
                <span className={tableStyles.metaValue}>{o.total_items}</span>
              </div>
            </div>
            <div className={tableStyles.cardActions}>
              <Link to={`/salidas/${o.id}`} className={`${tableStyles.cardBtn} ${tableStyles.viewBtn}`}>
                <i className="bx bx-show"></i> Detalle
              </Link>
              <button onClick={() => onDelete(o)} className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};