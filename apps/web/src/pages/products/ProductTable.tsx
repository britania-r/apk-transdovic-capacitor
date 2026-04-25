// File: apps/web/src/pages/products/ProductTable.tsx
import type { ProductWithDetails } from './ProductsPage';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './ProductTable.module.css';

interface Props {
  products: ProductWithDetails[];
  onEdit: (p: ProductWithDetails) => void;
  onDelete: (p: ProductWithDetails) => void;
}

const getStockStatus = (stock: number, threshold: number) => {
  if (stock === 0) return { label: 'Sin stock', className: styles.stockZero };
  if (stock <= threshold) return { label: 'Stock bajo', className: styles.stockLow };
  return { label: 'OK', className: styles.stockOk };
};

/**
 * Formatea el stock de un producto.
 * - Normal: "5 Und"
 * - Fraccional: "45 Lt (4 Gl + 5 Lt)"
 */
const formatStock = (p: ProductWithDetails): string => {
  const stock = Number(p.stock);

  if (!p.is_fractional || !p.units_per_package || !p.sub_unit_name) {
    return `${stock} ${p.unit_name}`;
  }

  const subUnit = p.sub_unit_name;
  const pkgUnit = p.unit_name;
  const perPkg = p.units_per_package;

  const fullPackages = Math.floor(stock / perPkg);
  const remainder = +(stock % perPkg).toFixed(2);

  if (fullPackages === 0) return `${stock} ${subUnit}`;
  if (remainder === 0) return `${stock} ${subUnit} (${fullPackages} ${pkgUnit})`;
  return `${stock} ${subUnit} (${fullPackages} ${pkgUnit} + ${remainder} ${subUnit})`;
};

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
              <th>Unidad</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const status = getStockStatus(p.stock, p.low_stock_threshold);
              return (
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
                    <div className={tableStyles.userInfo}>
                      <span className={tableStyles.userName}>{p.name}</span>
                      {p.subcategory_name && (
                        <span className={tableStyles.userEmail}>{p.subcategory_name}</span>
                      )}
                    </div>
                  </td>
                  <td className={tableStyles.monoCell}>{p.code}</td>
                  <td>{p.category_name}</td>
                  <td>{p.is_fractional ? `${p.unit_name} → ${p.sub_unit_name}` : p.unit_name}</td>
                  <td>
                    <div className={styles.stockCell}>
                      <span className={styles.stockNumber} title={formatStock(p)}>
                        {formatStock(p)}
                      </span>
                      <span className={`${styles.stockBadge} ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={tableStyles.cardList}>
        {products.map(p => {
          const status = getStockStatus(p.stock, p.low_stock_threshold);
          return (
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
                <div className={styles.stockCell}>
                  <span className={`${styles.stockBadge} ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              <div className={tableStyles.cardMeta}>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Categoría</span>
                  <span className={tableStyles.metaValue}>{p.category_name}</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Unidad</span>
                  <span className={tableStyles.metaValue}>
                    {p.is_fractional ? `${p.unit_name} → ${p.sub_unit_name}` : p.unit_name}
                  </span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Stock</span>
                  <span className={tableStyles.metaValue}>{formatStock(p)}</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Umbral bajo</span>
                  <span className={tableStyles.metaValue}>
                    {p.low_stock_threshold} {p.is_fractional ? p.sub_unit_name : p.unit_name}
                  </span>
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
          );
        })}
      </div>
    </>
  );
};