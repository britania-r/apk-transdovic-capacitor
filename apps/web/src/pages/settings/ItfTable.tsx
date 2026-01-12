// File: apps/web/src/pages/settings/ItfTable.tsx

import type { ItfRate } from './ItfPage';
import styles from './CategoryTable.module.css';

interface Props {
  rates: ItfRate[];
  onEdit: (rate: ItfRate) => void;
  onDelete: (rate: ItfRate) => void;
}

export const ItfTable = ({ rates, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Desde (S/)</th>
            <th>Hasta (S/)</th>
            {/* CAMBIO 7: Header actualizado */}
            <th>Cobro Fijo (S/)</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.id}>
              <td>S/ {Number(rate.range_start).toFixed(2)}</td>
              <td>S/ {Number(rate.range_end).toFixed(2)}</td>
              {/* CAMBIO 8: Mostrar Monto Fijo en formato moneda en lugar de % */}
              <td style={{ fontWeight: 'bold', color: '#eab308' }}>
                S/ {Number(rate.fixed_amount).toFixed(2)}
              </td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(rate)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(rate)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar">
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