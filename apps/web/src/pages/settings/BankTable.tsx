// File: apps/web/src/pages/settings/BankTable.tsx
import type { Bank } from './BanksPage';
import styles from './CategoryTable.module.css'; // Reutilizamos estilos de tabla existentes

interface Props {
  banks: Bank[];
  onEdit: (bank: Bank) => void;
  onDelete: (bank: Bank) => void;
}

export const BankTable = ({ banks, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre del Banco</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => (
            <tr key={bank.id}>
              <td>{bank.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(bank)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Banco">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(bank)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Banco">
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