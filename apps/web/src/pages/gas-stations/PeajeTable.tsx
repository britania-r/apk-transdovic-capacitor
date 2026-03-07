// File: apps/web/src/pages/gas-stations/PeajeTable.tsx
import type { Peaje } from './PeajesPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  peajes: Peaje[];
  onEdit: (peaje: Peaje) => void;
  onDelete: (peaje: Peaje) => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const getFrequencyLabel = (freq: number) =>
  freq === 1 ? 'Cobra 1 vez' : 'Cobra 2 veces';

export const PeajeTable = ({ peajes, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Peaje</th>
              <th>Frecuencia de cobro</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {peajes.map(peaje => (
              <tr key={peaje.id}>
                {/* Peaje: avatar iniciales + nombre */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{peaje.name}</span>
                      <span className={styles.userEmail}>
                        {getFrequencyLabel(peaje.billing_frequency)}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className={`${styles.roleBadge} ${peaje.billing_frequency === 1 ? styles.roleGerente : styles.roleConductor}`}>
                    {getFrequencyLabel(peaje.billing_frequency)}
                  </span>
                </td>

                <td>{peaje.notes || '—'}</td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(peaje)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(peaje)}
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
        {peajes.map(peaje => (
          <div key={peaje.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{peaje.name}</span>
                  <span className={styles.userEmail}>
                    {getFrequencyLabel(peaje.billing_frequency)}
                  </span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${peaje.billing_frequency === 1 ? styles.roleGerente : styles.roleConductor}`}>
                {peaje.billing_frequency === 1 ? '1x' : '2x'}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Frecuencia</span>
                <span className={styles.metaValue}>
                  {getFrequencyLabel(peaje.billing_frequency)}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Notas</span>
                <span className={styles.metaValue}>{peaje.notes || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => onEdit(peaje)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(peaje)}
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