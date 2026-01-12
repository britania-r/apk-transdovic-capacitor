// File: apps/web/src/pages/suppliers/ContactsTable.tsx

import type { Contact } from './SuppliersDetailsPage';
import styles from '../users/UserTable.module.css';

interface Props { contacts: Contact[]; onEdit: (contact: Contact) => void; onDelete: (contact: Contact) => void; }

export const ContactsTable = ({ contacts, onEdit, onDelete }: Props) => {
  if (contacts.length === 0) { return <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No hay contactos registrados para este proveedor.</p>; }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead><tr><th>Tipo</th><th>Contacto</th><th>Acciones</th></tr></thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>{contact.contact_type}</td>
              <td>{contact.contact_value}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(contact)} className={`${styles.actionButton} ${styles.editButton}`}><i className='bx bx-pencil'></i></button>
                  <button onClick={() => onDelete(contact)} className={`${styles.actionButton} ${styles.deleteButton}`}><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};