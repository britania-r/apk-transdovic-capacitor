// File: apps/web/src/pages/vehicles/VehicleTable.tsx
import type { Vehicle } from './VehiclesPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const getPlateInitials = (plate: string) =>
  plate.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'VH';

const formatCapacity = (kg: number) =>
  `${kg.toLocaleString('es-PE')} kg`;

export const VehicleTable = ({ vehicles, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Capacidad</th>
              <th>TUSE</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                {/* Vehículo: avatar iniciales placa + placa */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{vehicle.plate}</span>
                      <span className={styles.userEmail}>
                        {formatCapacity(vehicle.capacity_kg)}
                      </span>
                    </div>
                  </div>
                </td>

                <td className={styles.monoCell}>
                  {formatCapacity(vehicle.capacity_kg)}
                </td>

                <td>{vehicle.tuse || '—'}</td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(vehicle)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(vehicle)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={styles.cardList}>
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{vehicle.plate}</span>
                  <span className={styles.userEmail}>
                    {formatCapacity(vehicle.capacity_kg)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Capacidad</span>
                <span className={styles.metaValue}>
                  {formatCapacity(vehicle.capacity_kg)}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>TUSE</span>
                <span className={styles.metaValue}>{vehicle.tuse || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => onEdit(vehicle)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(vehicle)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};