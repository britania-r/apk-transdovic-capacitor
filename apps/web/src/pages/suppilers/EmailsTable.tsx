// File: apps/web/src/pages/suppliers/EmailsTable.tsx
import type { Email } from './SuppliersDetailsPage';
import styles from '../../components/ui/Table.module.css';
import sectionStyles from './SectionStyles.module.css';

interface Props {
  emails: Email[];
  onEdit: (e: Email) => void;
  onDelete: (e: Email) => void;
}

export const EmailsTable = ({ emails, onEdit, onDelete }: Props) => {
  if (emails.length === 0) {
    return (
      <div className={sectionStyles.empty}>
        <i className="bx bx-envelope"></i>
        <span>No hay emails registrados</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Notas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {emails.map(e => (
            <tr key={e.id}>
              <td className={styles.monoCell}>{e.email}</td>
              <td>{e.notes || '—'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(e)} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                    <i className="bx bx-pencil"></i>
                  </button>
                  <button onClick={() => onDelete(e)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Eliminar">
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};