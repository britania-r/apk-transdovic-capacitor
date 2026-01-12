import type { PettyCashTransaction } from './PettyCashPage';
import styles from '../users/UserTable.module.css';

interface Props {
  transactions: PettyCashTransaction[];
  onEdit: (t: PettyCashTransaction) => void;
  onDelete: (t: PettyCashTransaction) => void;
}

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency', currency
  }).format(amount);
};

export const PettyCashTable = ({ transactions, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Usuario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.transaction_date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
              <td>
                <span className={
                    t.transaction_type === 'Ingreso' ? styles.badgeSuccess : 
                    t.transaction_type === 'Gasto' ? styles.badgeError : styles.badge
                }>
                    {t.transaction_type}
                </span>
              </td>
              <td>{t.description}</td>
              <td style={{ fontWeight: 'bold', color: t.transaction_type === 'Ingreso' ? '#059669' : '#dc2626' }}>
                {formatMoney(t.amount, t.currency)}
              </td>
              <td>{t.user_name}</td>
              <td>
                <div className={styles.actions}>
                  {t.voucher_url && (
                    <a href={t.voucher_url} target="_blank" rel="noreferrer" className={styles.actionButton}>
                      <i className='bx bx-file'></i>
                    </a>
                  )}
                  {/* Solo permitimos editar/borrar si el usuario tiene permisos (aquí asumimos admin por ahora) */}
                  <button onClick={() => onEdit(t)} className={`${styles.actionButton} ${styles.editButton}`}>
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(t)} className={`${styles.actionButton} ${styles.deleteButton}`}>
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