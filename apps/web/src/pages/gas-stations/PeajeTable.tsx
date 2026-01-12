// File: apps/web/src/pages/gas-stations/PeajeTable.tsx
import { Link } from 'react-router-dom';
import type { Peaje } from './PeajesPage'; // Importaremos el tipo desde la página principal
import styles from '../../pages/users/UserTable.module.css'; // Reutilizamos estilos

interface Props {
  peajes: Peaje[];
  onEdit: (peaje: Peaje) => void;
  onDelete: (peaje: Peaje) => void;
}

export const PeajeTable = ({ peajes, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre del Peaje</th>
            <th>Frecuencia de Cobro</th>
            <th>Notas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {peajes.map((peaje) => (
            <tr key={peaje.id}>
              <td>{peaje.name}</td>
              {/* Hacemos el valor numérico más legible para el usuario */}
              <td>{peaje.billing_frequency === 1 ? 'Cobra 1 vez' : 'Cobra 2 veces'}</td>
              <td>{peaje.notes || '-'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(peaje)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Peaje">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(peaje)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Peaje">
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