// File: apps/web/src/pages/suppliers/SupplierTable.tsx
import { Link } from 'react-router-dom';
import type { SupplierInList } from './SuppliersPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  suppliers: SupplierInList[];
  onEdit: (supplier: SupplierInList) => void;
  onDelete: (supplier: SupplierInList) => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const SupplierTable = ({ suppliers, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>RUC</th>
              <th>Ciudad</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{supplier.trade_name}</span>
                      <span className={styles.userEmail}>{supplier.legal_name}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.monoCell}>{supplier.ruc}</td>
                <td>{supplier.city_name || '—'}</td>
                <td>{supplier.category_name || '—'}</td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/suppliers/${supplier.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver detalles"
                    >
                      <i className="bx bx-show"></i>
                    </Link>
                    <button
                      onClick={() => onEdit(supplier)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(supplier)}
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
        {suppliers.map(supplier => (
          <div key={supplier.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{supplier.trade_name}</span>
                  <span className={styles.userEmail}>{supplier.legal_name}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>RUC</span>
                <span className={styles.metaValue}>{supplier.ruc}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Ciudad</span>
                <span className={styles.metaValue}>{supplier.city_name || '—'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Categoría</span>
                <span className={styles.metaValue}>{supplier.category_name || '—'}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link to={`/suppliers/${supplier.id}`} className={`${styles.cardBtn} ${styles.viewBtn}`}>
                <i className="bx bx-show"></i> Ver
              </Link>
              <button onClick={() => onEdit(supplier)} className={`${styles.cardBtn} ${styles.editBtn}`}>
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button onClick={() => onDelete(supplier)} className={`${styles.cardBtn} ${styles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};