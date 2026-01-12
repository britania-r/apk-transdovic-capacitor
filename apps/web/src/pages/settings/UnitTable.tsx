// File: apps/web/src/pages/settings/UnitTable.tsx

import type { Unit } from './UnitsPage';
import styles from './CategoryTable.module.css'; // Reutilizamos estilos

interface Props {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

export const UnitTable = ({ units, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id}>
              <td>{unit.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(unit)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Unidad">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(unit)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Unidad">
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