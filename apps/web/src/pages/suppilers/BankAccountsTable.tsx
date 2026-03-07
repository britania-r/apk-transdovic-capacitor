// File: apps/web/src/pages/suppliers/BankAccountsTable.tsx
import type { BankAccount } from './SuppliersDetailsPage';
import styles from '../../components/ui/Table.module.css';
import sectionStyles from './SectionStyles.module.css';

interface Props {
  accounts: BankAccount[];
  onEdit: (acc: BankAccount) => void;
  onDelete: (acc: BankAccount) => void;
}

export const BankAccountsTable = ({ accounts, onEdit, onDelete }: Props) => {
  if (accounts.length === 0) {
    return (
      <div className={sectionStyles.empty}>
        <i className="bx bx-credit-card"></i>
        <span>No hay cuentas bancarias registradas</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Banco</th>
            <th>Moneda</th>
            <th>Número de cuenta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(acc => (
            <tr key={acc.id}>
              <td>{acc.bank_name}</td>
              <td>{acc.currency}</td>
              <td className={styles.monoCell}>{acc.account_number}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(acc)} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                    <i className="bx bx-pencil"></i>
                  </button>
                  <button onClick={() => onDelete(acc)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Eliminar">
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