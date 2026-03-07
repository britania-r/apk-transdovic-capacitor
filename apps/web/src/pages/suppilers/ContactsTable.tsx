// File: apps/web/src/pages/suppliers/ContactsTable.tsx
import type { Contact } from './SuppliersDetailsPage';
import styles from '../../components/ui/Table.module.css';
import sectionStyles from './SectionStyles.module.css';

interface Props {
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}

export const ContactsTable = ({ contacts, onEdit, onDelete }: Props) => {
  if (contacts.length === 0) {
    return (
      <div className={sectionStyles.empty}>
        <i className="bx bx-phone"></i>
        <span>No hay contactos registrados</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Número / Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id}>
              <td>{c.contact_type}</td>
              <td className={styles.monoCell}>{c.contact_value}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(c)} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                    <i className="bx bx-pencil"></i>
                  </button>
                  <button onClick={() => onDelete(c)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Eliminar">
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