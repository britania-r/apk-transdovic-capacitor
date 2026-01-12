// File: apps/web/src/pages/settings/CityTable.tsx

import type { City } from './CitiesPage';
import styles from './CategoryTable.module.css'; // Reutilizamos estilos

interface Props {
  cities: City[];
  onEdit: (city: City) => void;
  onDelete: (city: City) => void;
}

export const CityTable = ({ cities, onEdit, onDelete }: Props) => {
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
          {cities.map((city) => (
            <tr key={city.id}>
              <td>{city.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(city)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Ciudad">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(city)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Ciudad">
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