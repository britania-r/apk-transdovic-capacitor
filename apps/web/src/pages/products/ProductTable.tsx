// File: apps/web/src/pages/products/ProductTable.tsx
import type { ProductWithDetails } from './ProductsPage';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './ProductTable.module.css';

interface Props {
  products: ProductWithDetails[];
  onEdit: (p: ProductWithDetails) => void;
  onDelete: (p: ProductWithDetails) => void;
}

export const ProductTable = ({ products, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ width: '60px' }}></th>
              <th>Producto</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th>Unidad</th>
              <th>Stock bajo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <div className={styles.imgCell}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className={styles.img} />
                    ) : (
                      <div className={styles.imgPlaceholder}>
                        <i className="bx bx-package"></i>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={tableStyles.userName}>{p.name}</span>
                </td>
                <td className={tableStyles.monoCell}>{p.code}</td>
                <td>{p.category_name}</td>
                <td>{p.subcategory_name || '—'}</td>
                <td>{p.unit_name}</td>
                <td>
                  <span className={styles.stockBadge}>{p.low_stock_threshold}</span>
                </td>
                <td>
                  <div className={tableStyles.actions}>
                    <button onClick={() => onEdit(p)} className={`${tableStyles.actionBtn} ${tableStyles.editBtn}`} title="Editar">
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button onClick={() => onDelete(p)} className={`${tableStyles.actionBtn} ${tableStyles.deleteBtn}`} title="Eliminar">
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
      <div className={tableStyles.cardList}>
        {products.map(p => (
          <div key={p.id} className={tableStyles.card}>
            <div className={tableStyles.cardTop}>
              <div className={tableStyles.cardLeft}>
                <div className={styles.imgCellCard}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className={styles.img} />
                  ) : (
                    <div className={styles.imgPlaceholder}>
                      <i className="bx bx-package"></i>
                    </div>
                  )}
                </div>
                <div className={tableStyles.userInfo}>
                  <span className={tableStyles.userName}>{p.name}</span>
                  <span className={tableStyles.userEmail}>{p.code}</span>
                </div>
              </div>
            </div>

            <div className={tableStyles.cardMeta}>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Categoría</span>
                <span className={tableStyles.metaValue}>{p.category_name}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Subcategoría</span>
                <span className={tableStyles.metaValue}>{p.subcategory_name || '—'}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Unidad</span>
                <span className={tableStyles.metaValue}>{p.unit_name}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Stock bajo</span>
                <span className={tableStyles.metaValue}>{p.low_stock_threshold}</span>
              </div>
            </div>

            <div className={tableStyles.cardActions}>
              <button onClick={() => onEdit(p)} className={`${tableStyles.cardBtn} ${tableStyles.editBtn}`}>
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button onClick={() => onDelete(p)} className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};