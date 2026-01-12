import { Link } from 'react-router-dom';
import type { IncomeRecord } from './IngresosPage';
import styles from '../users/UserTable.module.css';

interface Props {
  incomes: IncomeRecord[];
  onEdit: (income: IncomeRecord) => void; // <--- Nueva prop
  onDelete: (income: IncomeRecord) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
}).format(value);

export const IngresosTable = ({ incomes, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>N° Mov.</th>
            <th>Cuenta Destino</th>
            <th>Tipo de Registro</th>
            <th>N° de Factura</th>
            <th>Registrado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((income) => (
            <tr key={income.id}>
              <td>{new Date(income.income_date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
              <td><strong>{formatCurrency(income.amount)}</strong></td>
              
              <td style={{ fontFamily: 'monospace', color: '#555' }}>
                {income.movement_number || '-'}
              </td>

              <td>{income.account_display}</td>
              <td>
                {income.income_type === 'Varias Facturas' 
                  ? <span className={styles.badge}>Varias Facturas</span> 
                  : 'Factura Única'}
              </td>
              <td>{income.reference_number || '--'}</td>
              <td>{income.user_name}</td>
              <td>
                <div className={styles.actions}>
                  {income.income_type === 'Factura Única' && income.invoice_url && (
                    <a href={income.invoice_url} target="_blank" rel="noopener noreferrer" className={styles.actionButton} title="Ver Comprobante">
                        <i className='bx bx-file'></i> 
                    </a>
                  )}
                  {income.income_type === 'Varias Facturas' && (
                    <Link to={`/ingresos/${income.id}`} className={styles.actionButton} title="Ver Detalles"><i className='bx bx-detail'></i></Link>
                  )}
                  
                  {/* BOTÓN EDITAR */}
                  <button 
                    onClick={() => onEdit(income)} 
                    className={`${styles.actionButton} ${styles.editButton}`} 
                    title="Editar Ingreso"
                  >
                    <i className='bx bx-pencil'></i>
                  </button>

                  {/* BOTÓN ELIMINAR */}
                  <button 
                    onClick={() => onDelete(income)} 
                    className={`${styles.actionButton} ${styles.deleteButton}`} 
                    title="Eliminar Ingreso"
                  >
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