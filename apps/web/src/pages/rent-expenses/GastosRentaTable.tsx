import styles from '../users/UserTable.module.css';

export interface RentExpense {
  id: string;
  expense_date: string;
  document_type: string;
  document_number: string;
  concept: string;
  detail: string;
  amount: number;
  payment_origin: string;
  voucher_url: string;
  currency: string; // Necesitamos esto para formatear
}

interface Props {
  expenses: RentExpense[];
  onDelete: (id: string) => void;
}

const formatMoney = (amount: number, currency: string) => 
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: currency || 'PEN' }).format(amount);

export const GastosRentaTable = ({ expenses, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Documento</th>
            <th>N° Doc</th>
            <th>Concepto</th>
            <th>Detalle</th>
            <th>Origen Pago</th>
            <th>Importe</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.expense_date).toLocaleDateString()}</td>
              <td>{row.document_type}</td>
              <td><span className={styles.badge}>{row.document_number}</span></td>
              <td>{row.concept}</td>
              <td style={{maxWidth:'200px', whiteSpace:'normal'}}>{row.detail}</td>
              <td>
                <span className={row.payment_origin === 'BANCO' ? styles.completed : styles.pending}>
                  {row.payment_origin}
                </span>
              </td>
              <td><strong>{formatMoney(row.amount, row.currency)}</strong></td>
              <td>
                <div className={styles.actions}>
                  {row.voucher_url && <a href={row.voucher_url} target="_blank" className={styles.actionButton}><i className='bx bx-file'></i></a>}
                  {/* Por ahora solo borrar, la edición es compleja con movimientos de dinero */}
                  <button onClick={() => onDelete(row.id)} className={`${styles.actionButton} ${styles.deleteButton}`}><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};