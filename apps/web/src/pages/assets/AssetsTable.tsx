// File: apps/web/src/pages/assets/AssetsTable.tsx
import type { Asset } from './AssetsPage';
import styles from '../../components/ui/Table.module.css';

interface Props {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const getBrandModel = (asset: Asset) =>
  `${asset.brand || ''} ${asset.model || ''}`.trim() || '—';

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

export const AssetsTable = ({ assets, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Categoría</th>
              <th>Costo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                {/* Activo: avatar + nombre + marca/modelo */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{asset.name}</span>
                      <span className={styles.userEmail}>
                        {getBrandModel(asset)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Categoría badge */}
                <td>
                  <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                    {asset.category_name}
                  </span>
                </td>

                <td className={styles.monoCell}>
                  {formatCurrency(asset.cost)}
                </td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(asset)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(asset)}
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
        {assets.map(asset => (
          <div key={asset.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{asset.name}</span>
                  <span className={styles.userEmail}>
                    {getBrandModel(asset)}
                  </span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                {asset.category_name}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Categoría</span>
                <span className={styles.metaValue}>{asset.category_name}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Costo</span>
                <span className={styles.metaValue}>{formatCurrency(asset.cost)}</span>
              </div>
              {asset.serial_number && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>N° Serie</span>
                  <span className={styles.metaValue}>{asset.serial_number}</span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => onEdit(asset)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(asset)}
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