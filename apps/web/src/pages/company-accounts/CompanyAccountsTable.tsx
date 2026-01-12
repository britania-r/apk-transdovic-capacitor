import type { CompanyAccount } from './CompanyAccountsPage';
import styles from '../users/UserTable.module.css';

interface Props {
  accounts: CompanyAccount[];
  onEdit: (account: CompanyAccount) => void;
  onDelete: (account: CompanyAccount) => void;
}

const formatCurrency = (value: number | null | undefined, currency: string) => {
  const currencyCode = currency === 'USD' ? 'USD' : 'PEN';
  const locale = currency === 'USD' ? 'en-US' : 'es-PE';
  
  if (value === null || value === undefined) {
    return currencyCode === 'USD' ? '$ 0.00' : 'S/ 0.00';
  }
  
  // Formateamos usando Intl
  const formatted = new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 2 
  }).format(value);

  // Truco para agregar espacio en USD: Reemplazar "$" por "$ "
  if (currencyCode === 'USD') {
      return formatted.replace('$', '$ ');
  }

  return formatted;
};

export const CompanyAccountsTable = ({ accounts, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Banco / Caja</th>
            <th>Moneda</th>
            <th>Número de Cuenta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Icono diferente si es Caja o Banco */}
                    <i className={`bx ${account.account_type === 'CAJA' ? 'bx-box' : 'bxs-bank'}`} style={{ color: '#6b7280' }}></i>
                    <span style={{ fontWeight: 500 }}>{account.bank_name}</span>
                </div>
              </td>
              <td>
                <span className={account.currency === 'USD' ? styles.tagUsd : styles.tagPen}>
                    {account.currency}
                </span>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#555' }}>
                {account.account_number || '-'}
              </td>
   
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(account)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(account)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar">
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