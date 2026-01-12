// File: apps/web/src/pages/vehicles/VehicleTable.tsx
import type { Vehicle } from './VehiclesPage';
import styles from '../../pages/users/UserTable.module.css';

interface Props {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export const VehicleTable = ({ vehicles, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Capacidad (Kg)</th>
            <th>TUCE</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>{vehicle.plate}</td>
              <td>{vehicle.capacity_kg.toLocaleString('es-PE')} kg</td>
              <td>{vehicle.tuse || '-'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(vehicle)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Vehículo">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(vehicle)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Vehículo">
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