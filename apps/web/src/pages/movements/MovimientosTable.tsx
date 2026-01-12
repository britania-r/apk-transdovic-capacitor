import type { Movement } from './MovimientosPage';
import styles from '../users/UserTable.module.css';

interface Props {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onVerify: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
  style: 'currency',
  currency: currency,
}).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const MovimientosTable = ({ movements, onEdit, onVerify, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>N° Mov.</th> {/* NUEVO */}
            <th>N° Op.</th>  {/* NUEVO */}
            <th>Cuentas</th>
            <th>Registrado</th>
            <th>Verificado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((mov) => (
            <tr key={mov.id}>
              <td>{formatDate(mov.movement_date)}</td>
              <td>{mov.movement_type}</td>
              <td><strong>{formatCurrency(mov.amount, mov.currency)}</strong></td>
              
              {/* N° Movimiento (Usamos casting si TS se queja por interfaz antigua) */}
              <td style={{ fontFamily: 'monospace', color: '#555' }}>
                {(mov as any).movement_number || '-'}
              </td>
              
              {/* N° Operación */}
              <td style={{ fontSize: '0.9em' }}>
                {(mov as any).operation_number || '-'}
              </td>

              <td>
                {mov.origin_account_name && <div title="Origen"><i className='bx bx-up-arrow-alt' style={{color:'red'}}></i> {mov.origin_account_name}</div>}
                {mov.destination_account_name && <div title="Destino"><i className='bx bx-down-arrow-alt' style={{color:'green'}}></i> {mov.destination_account_name}</div>}
              </td>
              <td>{mov.registered_by_user}</td>
              <td>{mov.verified_by_user || 'Pendiente'}</td>
              <td>
                <div className={styles.actions}>
                  {mov.voucher_url && <a href={mov.voucher_url} target="_blank" rel="noreferrer" className={styles.actionButton} title="Ver"><i className='bx bx-file'></i></a>}
                  <button onClick={() => onEdit(mov)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><i className='bx bx-pencil'></i></button>
                  <button onClick={() => onDelete(mov)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar">
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