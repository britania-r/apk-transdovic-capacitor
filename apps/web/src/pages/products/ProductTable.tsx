import type { ProductWithDetails } from './ProductsPage';
import styles from '../users/UserTable.module.css'; // Reutilizamos estilos de tabla
import productStyles from './ProductTable.module.css'; // Estilos específicos para esta tabla

interface Props {
  products: ProductWithDetails[];
  onEdit: (product: ProductWithDetails) => void;
  onDelete: (product: ProductWithDetails) => void;
}

export const ProductTable = ({ products, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Imagen</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Unidad</th>
            <th>Stock Bajo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className={productStyles.imageCell}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className={productStyles.productImage} />
                  ) : (
                    <div className={productStyles.imagePlaceholder}>
                      <i className='bx bx-package'></i>
                    </div>
                  )}
                </div>
              </td>
              <td>{product.code}</td>
              <td>{product.name}</td>
              <td>{product.category_name}</td>
              <td>{product.subcategory_name || '-'}</td>
              <td>{product.unit_name}</td>
              <td>{product.low_stock_threshold}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(product)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Producto">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(product)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Producto">
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