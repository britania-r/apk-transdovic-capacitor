// File: apps/web/src/pages/company-accounts/CompanyAccountsTable.tsx
import type { CompanyAccount } from './CompanyAccountsPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  accounts: CompanyAccount[];
  onEdit: (account: CompanyAccount) => void;
  onDelete: (account: CompanyAccount) => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const getCurrencyLabel = (currency: string) =>
  currency === 'USD' ? 'Dólares ($)' : 'Soles (S/)';

export const CompanyAccountsTable = ({ accounts, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Banco / Caja</th>
              <th>Tipo</th>
              <th>Moneda</th>
              <th>Número de cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id}>
                {/* Banco/Caja: avatar + nombre + moneda */}
                <td>
                  <div className={styles.userCell}>
  
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{account.bank_name}</span>
                      <span className={styles.userEmail}>
                        {getCurrencyLabel(account.currency)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Tipo badge */}
                <td>
                  <span className={`${styles.roleBadge} ${account.account_type === 'CAJA' ? styles.roleAsistente : styles.roleGerente}`}>
                    {account.account_type === 'CAJA' ? 'Caja' : 'Banco'}
                  </span>
                </td>

                {/* Moneda badge */}
                <td>
                  <span className={`${styles.roleBadge} ${account.currency === 'USD' ? styles.roleConductor : styles.roleAdmin}`}>
                    {account.currency}
                  </span>
                </td>

                <td className={styles.monoCell}>
                  {account.account_number || '—'}
                </td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(account)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(account)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={styles.cardList}>
        {accounts.map(account => (
          <div key={account.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>

                <div className={styles.userInfo}>
                  <span className={styles.userName}>{account.bank_name}</span>
                  <span className={styles.userEmail}>
                    {getCurrencyLabel(account.currency)}
                  </span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${account.account_type === 'CAJA' ? styles.roleAsistente : styles.roleGerente}`}>
                {account.account_type === 'CAJA' ? 'Caja' : 'Banco'}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Moneda</span>
                <span className={styles.metaValue}>{getCurrencyLabel(account.currency)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>N° Cuenta</span>
                <span className={styles.metaValue}>{account.account_number || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => onEdit(account)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(account)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};