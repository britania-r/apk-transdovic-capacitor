// File: apps/web/src/pages/suppliers/EmailsTable.tsx

import type { Email } from './SuppliersDetailsPage';
import styles from '../users/UserTable.module.css';

interface Props { emails: Email[]; onEdit: (email: Email) => void; onDelete: (email: Email) => void; }

export const EmailsTable = ({ emails, onEdit, onDelete }: Props) => {
  if (emails.length === 0) { return <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No hay emails registrados para este proveedor.</p>; }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead><tr><th>Email</th><th>Notas</th><th>Acciones</th></tr></thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.id}>
              <td>{email.email}</td>
              <td>{email.notes || '-'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(email)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Email"><i className='bx bx-pencil'></i></button>
                  <button onClick={() => onDelete(email)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Email"><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};