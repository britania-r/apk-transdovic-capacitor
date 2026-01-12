import { Link } from 'react-router-dom';
import type { Operation } from './OperationsPage';
import styles from '../users/UserTable.module.css';

interface Props {
  operations: Operation[];
  onEdit: (op: Operation) => void;
  onDelete: (op: Operation) => void;
}

const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

const formatDate = (date: string) => {
    if(!date) return '';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
};

export const OperationsTable = ({ operations, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Detalles</th> {/* CORREGIDO: Antes Descripción */}
            <th>Monto</th>
            <th>Cuenta</th>
            <th>N° Mov.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => (
            <tr key={op.id}>
              <td>{formatDate(op.operation_date)}</td>
              <td>
                <span className={
                    op.operation_type === 'INGRESO' ? styles.badgeSuccess : 
                    op.operation_type === 'GASTO' ? styles.badgeError : styles.badge
                }>
                    {op.operation_type}
                </span>
                {/* Indicador visual si es múltiple */}
                {(op as any).is_multiple && (
                    <span style={{fontSize:'0.7em', display:'block', color:'#666', marginTop:'2px'}}>
                        (Múltiple)
                    </span>
                )}
              </td>
              <td>{op.description || '-'}</td>
              <td style={{ fontWeight: 'bold' }}>{formatCurrency(op.amount)}</td>
              <td>
                <small>{op.account_name}</small>
                {op.operation_type === 'TRANSFERENCIA' && (
                    <div style={{ fontSize: '0.8em', color: '#666' }}>➝ {op.destination_name}</div>
                )}
              </td>
              <td style={{ fontFamily: 'monospace' }}>{op.movement_number || '-'}</td>
              <td>
                <div className={styles.actions}>
                  
                  {/* CASO 1: Múltiples Facturas -> Ir a Detalle */}
                  {(op as any).is_multiple && (
                    <Link 
                        to={`/operaciones/${op.id}`} 
                        className={styles.actionButton} 
                        title="Ver Detalles / Facturas"
                        style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
                    >
                        <i className='bx bx-spreadsheet'></i>
                    </Link>
                  )}

                  {/* CASO 2: Factura Única -> Ver Archivo Directo */}
                  {!(op as any).is_multiple && op.voucher_url && (
                    <a 
                        href={op.voucher_url} 
                        target="_blank" 
                        className={styles.actionButton} 
                        title="Ver Comprobante"
                    >
                        <i className='bx bx-file'></i>
                    </a>
                  )}

                  <button onClick={() => onEdit(op)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><i className='bx bx-pencil'></i></button>
                  <button onClick={() => onDelete(op)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar"><i className='bx bx-trash'></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};