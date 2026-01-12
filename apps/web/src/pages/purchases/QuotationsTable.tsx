import styles from '../users/UserTable.module.css';
import statusStyles from './StatusBadge.module.css';

const ApprovalBadge = ({ isApproved }: { isApproved: boolean }) => {
  const className = isApproved ? statusStyles.completed : statusStyles.pending;
  const text = isApproved ? 'Aprobada' : 'Pendiente';
  return <span className={`${statusStyles.badge} ${className}`}>{text}</span>;
};

export const QuotationsTable = ({ quotations, onApprove, onDelete }) => {
  const isAnyApproved = quotations.some(q => q.is_approved);

  if (quotations.length === 0) {
    return <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Aún no se han adjuntado cotizaciones.</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead><tr><th>Proveedor</th><th>Archivo</th><th>Estado</th><th>Aprobado por</th><th>Acciones</th></tr></thead>
        <tbody>
          {quotations.map((q) => (
            <tr key={q.id}>
              <td>{q.supplier_name}</td>
              <td><a href={q.file_url} target="_blank" rel="noopener noreferrer" className="link">Ver PDF</a></td>
              <td><ApprovalBadge isApproved={q.is_approved} /></td>
              <td>{q.approved_by_name || '-'}</td>
              <td>
                <div className={styles.actions}>
                  {!q.is_approved && !isAnyApproved && (
                    <button onClick={() => onApprove(q)} className={`${styles.actionButton} ${styles.approveButton}`} title="Aprobar Cotización">
                      <i className='bx bx-check-shield'></i>
                    </button>
                  )}
                  <button onClick={() => onDelete(q)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Cotización"><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};