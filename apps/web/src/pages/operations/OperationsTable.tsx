// File: apps/web/src/pages/operations/OperationsTable.tsx
import { Link } from 'react-router-dom';
import type { Operation } from './hooks/useOperations';
import styles from '../../components/ui/Table.module.css';
import localStyles from './OperationsTable.module.css';

interface Props {
  operations: Operation[];
  onEdit: (op: Operation) => void;
  onDelete: (op: Operation) => void;
}

const TYPE_STYLES: Record<string, string> = {
  GASTO:         localStyles.typeGasto,
  DEPOSITO:      localStyles.typeDeposito,
  RETIRO:        localStyles.typeRetiro,
  PAGO:          localStyles.typePago,
  TRANSFERENCIA: localStyles.typeTransferencia,
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

export const OperationsTable = ({ operations, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Detalle</th>
              <th>Monto</th>
              <th>Cuenta</th>
              <th>N° Mov.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {operations.map(op => (
              <tr key={op.id}>
                {/* Tipo badge */}
                <td>
                  <span className={`${localStyles.typeBadge} ${TYPE_STYLES[op.operation_type] || localStyles.typeDefault}`}>
                    {op.operation_type}
                  </span>
                  {(op as any).is_multiple && (
                    <span className={localStyles.multipleBadge}>Múltiple</span>
                  )}
                </td>

                <td>{formatDate(op.operation_date)}</td>

                <td className={localStyles.detailCell}>
                  {op.detail || op.description || '—'}
                </td>

                <td className={localStyles.amountCell}>
                  {formatCurrency(op.amount, op.currency)}
                </td>

                <td>
                  <span className={localStyles.accountText}>{op.account_name || '—'}</span>
                  {op.operation_type === 'TRANSFERENCIA' && op.destination_name && (
                    <span className={localStyles.transferArrow}>
                      <i className="bx bx-right-arrow-alt"></i> {op.destination_name}
                    </span>
                  )}
                </td>

                <td className={styles.monoCell}>
                  {op.movement_number || '—'}
                </td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    {(op as any).is_multiple && (
                      <Link
                        to={`/operaciones/${op.id}`}
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        title="Ver facturas"
                      >
                        <i className="bx bx-folder"></i>
                      </Link>
                    )}
                    {!(op as any).is_multiple && op.voucher_url && (
                      <a
                        href={op.voucher_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        title="Ver comprobante"
                      >
                        <i className="bx bx-file"></i>
                      </a>
                    )}
                    <button
                      onClick={() => onEdit(op)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(op)}
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
        {operations.map(op => (
          <div key={op.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={localStyles.cardInfo}>
                <span className={`${localStyles.typeBadge} ${TYPE_STYLES[op.operation_type] || localStyles.typeDefault}`}>
                  {op.operation_type}
                </span>
                {(op as any).is_multiple && (
                  <span className={localStyles.multipleBadge}>Múltiple</span>
                )}
              </div>
              <span className={localStyles.cardAmount}>
                {formatCurrency(op.amount, op.currency)}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Fecha</span>
                <span className={styles.metaValue}>{formatDate(op.operation_date)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Cuenta</span>
                <span className={styles.metaValue}>{op.account_name || '—'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Detalle</span>
                <span className={styles.metaValue}>{op.detail || op.description || '—'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>N° Mov.</span>
                <span className={styles.metaValue}>{op.movement_number || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              {(op as any).is_multiple && (
                <Link to={`/operaciones/${op.id}`} className={`${styles.cardBtn} ${styles.viewBtn}`}>
                  <i className="bx bx-spreadsheet"></i> Facturas
                </Link>
              )}
              {!(op as any).is_multiple && op.voucher_url && (
                <a href={op.voucher_url} target="_blank" rel="noopener noreferrer" className={`${styles.cardBtn} ${styles.viewBtn}`}>
                  <i className="bx bx-file"></i> Voucher
                </a>
              )}
              <button onClick={() => onEdit(op)} className={`${styles.cardBtn} ${styles.editBtn}`}>
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button onClick={() => onDelete(op)} className={`${styles.cardBtn} ${styles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};