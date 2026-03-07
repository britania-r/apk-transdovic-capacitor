// File: apps/web/src/pages/farms/FarmTable.tsx
import { Link } from 'react-router-dom';
import type { FarmWithCity } from './FarmsPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  farms: FarmWithCity[];
  onEdit: (farm: FarmWithCity) => void;
  onDelete: (farm: FarmWithCity) => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const FarmTable = ({ farms, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Granja</th>
              <th>RUC</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {farms.map(farm => (
              <tr key={farm.id}>
                {/* Granja: avatar + nombre + RUC como sublabel */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{farm.name}</span>
                      <span className={styles.userEmail}>{farm.ruc}</span>
                    </div>
                  </div>
                </td>

                <td className={styles.monoCell}>{farm.ruc}</td>

                <td>
                  <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                    {farm.city_name || 'N/A'}
                  </span>
                </td>

                <td>{farm.address || '—'}</td>

                {/* Acciones: ver + editar + eliminar */}
                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/farms/${farm.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver detalles"
                    >
                      <i className="bx bx-show"></i>
                    </Link>
                    <button
                      onClick={() => onEdit(farm)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(farm)}
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
        {farms.map(farm => (
          <div key={farm.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{farm.name}</span>
                  <span className={styles.userEmail}>{farm.ruc}</span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                {farm.city_name || 'N/A'}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>RUC</span>
                <span className={styles.metaValue}>{farm.ruc}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Ciudad</span>
                <span className={styles.metaValue}>{farm.city_name || 'N/A'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Dirección</span>
                <span className={styles.metaValue}>{farm.address || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                to={`/farms/${farm.id}`}
                className={`${styles.cardBtn} ${styles.viewBtn}`}
              >
                <i className="bx bx-show"></i> Ver
              </Link>
              <button
                onClick={() => onEdit(farm)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(farm)}
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