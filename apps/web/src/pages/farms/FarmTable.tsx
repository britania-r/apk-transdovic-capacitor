// File: apps/web/src/pages/farms/FarmTable.tsx
import { Link } from 'react-router-dom';
import type { FarmWithCity } from './FarmsPage';
import styles from '../../pages/users/UserTable.module.css';

interface Props {
  farms: FarmWithCity[];
  onEdit: (farm: FarmWithCity) => void;
  onDelete: (farm: FarmWithCity) => void;
}

export const FarmTable = ({ farms, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre Comercial</th>
            <th>RUC</th>
            <th>Ciudad</th>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {farms.map((farm) => (
            <tr key={farm.id}>
              <td>{farm.name}</td>
              <td>{farm.ruc}</td>
              <td>{farm.city_name || 'N/A'}</td>
              <td>{farm.address || '-'}</td>
              <td>
                <div className={styles.actions}>
                  <Link to={`/farms/${farm.id}`} className={`${styles.actionButton} ${styles.detailsButton}`} title="Ver Detalles">
                    <i className='bx bx-show'></i>
                  </Link>
                  <button onClick={() => onEdit(farm)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Granja">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(farm)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Granja">
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