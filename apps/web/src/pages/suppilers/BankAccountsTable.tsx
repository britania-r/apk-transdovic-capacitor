import type { BankAccount } from './SuppliersDetailsPage';
// --- CORRECCIÓN: Importamos los estilos de la tabla principal de usuarios/vehículos ---
import styles from '../users/UserTable.module.css';

interface Props { accounts: BankAccount[]; onEdit: (acc: BankAccount) => void; onDelete: (acc: BankAccount) => void; }

export const BankAccountsTable = ({ accounts, onEdit, onDelete }: Props) => {
  if (accounts.length === 0) {
    return <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No hay cuentas bancarias registradas para este proveedor.</p>;
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Banco</th>
            <th>Moneda</th>
            <th>Número de Cuenta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td>{acc.bank_name}</td>
              <td>{acc.currency}</td>
              <td>{acc.account_number}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(acc)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Cuenta">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(acc)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Cuenta">
                    <i className='bx bx-trash'></i>
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