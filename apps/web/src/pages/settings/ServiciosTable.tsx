// File: apps/web/src/pages/settings/ServiciosTable.tsx

import type { Servicio } from './ServiciosPage';
import styles from './CategoryTable.module.css'; // Reutilizamos los estilos de CategoryTable como solicitaste

interface Props {
  servicios: Servicio[];
  onEdit: (servicio: Servicio) => void;
  onDelete: (servicio: Servicio) => void;
}

export const ServiciosTable = ({ servicios, onEdit, onDelete }: Props) => {
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
          {servicios.map((servicio) => (
            <tr key={servicio.id}>
              <td>{servicio.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(servicio)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Servicio">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(servicio)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Servicio">
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