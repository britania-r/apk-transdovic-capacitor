// File: apps/web/src/pages/petty-cash/PettyCashTable.tsx
import type { PettyCashTransaction } from './PettyCashPage';
import styles from '../../components/ui/Table.module.css';
import localStyles from './PettyCashTable.module.css';

interface Props {
  transactions: PettyCashTransaction[];
  onEdit: (t: PettyCashTransaction) => void;
  onDelete: (t: PettyCashTransaction) => void;
}

const TYPE_STYLES: Record<string, string> = {
  Ingreso:    localStyles.typeIngreso,
  Gasto:      localStyles.typeGasto,
  Devolución: localStyles.typeDevolucion,
};

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency,
  }).format(amount);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const PettyCashTable = ({ transactions, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                {/* Usuario con avatar */}
                <td>
                  <div className={styles.userCell}>

                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{t.user_name}</span>
                      <span className={styles.userEmail}>
                        {t.document_number || '—'}
                      </span>
                    </div>
                  </div>
                </td>

                <td>{formatDate(t.transaction_date)}</td>

                {/* Tipo badge */}
                <td>
                  <span className={`${localStyles.typeBadge} ${TYPE_STYLES[t.transaction_type] || localStyles.typeDefault}`}>
                    {t.transaction_type}
                  </span>
                </td>

                <td className={localStyles.descriptionCell}>
                  {t.description || '—'}
                </td>

                <td className={`${localStyles.amountCell} ${t.transaction_type === 'Ingreso' ? localStyles.amountPositive : localStyles.amountNegative}`}>
                  {formatMoney(t.amount, t.currency)}
                </td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    {t.voucher_url && (
                      <a
                        href={t.voucher_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        title="Ver comprobante"
                      >
                        <i className="bx bx-file"></i>
                      </a>
                    )}
                    <button
                      onClick={() => onEdit(t)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(t)}
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
        {transactions.map(t => (
          <div key={t.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{t.user_name}</span>
                  <span className={styles.userEmail}>{formatDate(t.transaction_date)}</span>
                </div>
              </div>
              <span className={`${localStyles.typeBadge} ${TYPE_STYLES[t.transaction_type] || localStyles.typeDefault}`}>
                {t.transaction_type}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Monto</span>
                <span className={`${styles.metaValue} ${t.transaction_type === 'Ingreso' ? localStyles.amountPositive : localStyles.amountNegative}`}>
                  {formatMoney(t.amount, t.currency)}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Descripción</span>
                <span className={styles.metaValue}>{t.description || '—'}</span>
              </div>
              {t.document_number && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>N° Doc</span>
                  <span className={styles.metaValue}>{t.document_number}</span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              {t.voucher_url && (
                <a
                  href={t.voucher_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.cardBtn} ${styles.viewBtn}`}
                >
                  <i className="bx bx-file"></i> Voucher
                </a>
              )}
              <button
                onClick={() => onEdit(t)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(t)}
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