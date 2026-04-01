// File: apps/web/src/pages/purchases/QuotationsTable.tsx
import type { Quotation } from './PurchasesDetailsPage';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './QuotationsTable.module.css';

interface Props {
  quotations: Quotation[];
  onApprove: (q: Quotation) => void;
  onDelete: (q: Quotation) => void;
}

export const QuotationsTable = ({ quotations, onApprove, onDelete }: Props) => {
  const isAnyApproved = quotations.some(q => q.is_approved);

  if (quotations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-file-find"></i>
        <span>Aún no se han adjuntado cotizaciones</span>
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
              <th>Proveedor</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Aprobado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id}>
                <td>
                  <span className={tableStyles.userName}>{q.supplier_name}</span>
                </td>
                <td>
                  <a
                    href={q.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    <i className="bx bx-file"></i> Ver PDF
                  </a>
                </td>
                <td>
                  <span className={`${styles.approvalBadge} ${q.is_approved ? styles.approved : styles.pending}`}>
                    {q.is_approved ? 'Aprobada' : 'Pendiente'}
                  </span>
                </td>
                <td>{q.approved_by_name || '—'}</td>
                <td>
                  <div className={tableStyles.actions}>
                    {!q.is_approved && !isAnyApproved && (
                      <button
                        onClick={() => onApprove(q)}
                        className={`${tableStyles.actionBtn} ${styles.approveBtn}`}
                        title="Aprobar cotización"
                      >
                        <i className="bx bx-check-shield"></i>
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(q)}
                      className={`${tableStyles.actionBtn} ${tableStyles.deleteBtn}`}
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
      <div className={tableStyles.cardList}>
        {quotations.map(q => (
          <div key={q.id} className={tableStyles.card}>
            <div className={tableStyles.cardTop}>
              <div className={tableStyles.userInfo}>
                <span className={tableStyles.userName}>{q.supplier_name}</span>
                <span className={tableStyles.userEmail}>{q.approved_by_name ? `Aprobó: ${q.approved_by_name}` : ''}</span>
              </div>
              <span className={`${styles.approvalBadge} ${q.is_approved ? styles.approved : styles.pending}`}>
                {q.is_approved ? 'Aprobada' : 'Pendiente'}
              </span>
            </div>

            <div className={tableStyles.cardActions}>
              <a
                href={q.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tableStyles.cardBtn} ${tableStyles.viewBtn}`}
              >
                <i className="bx bx-file"></i> Ver PDF
              </a>
              {!q.is_approved && !isAnyApproved && (
                <button onClick={() => onApprove(q)} className={`${tableStyles.cardBtn} ${styles.approveBtnCard}`}>
                  <i className="bx bx-check-shield"></i> Aprobar
                </button>
              )}
              <button onClick={() => onDelete(q)} className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};