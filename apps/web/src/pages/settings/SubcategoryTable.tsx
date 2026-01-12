import type { SubcategoryWithCategory } from './SubcategoriesPage';
import styles from './CategoryTable.module.css'; // Correcto, reutilizamos este estilo

interface Props {
  subcategories: SubcategoryWithCategory[];
  onEdit: (subcategory: SubcategoryWithCategory) => void;
  onDelete: (subcategory: SubcategoryWithCategory) => void;
}

export const SubcategoryTable = ({ subcategories, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre Subcategoría</th>
            <th>Categoría Padre</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {subcategories.map((subcategory) => (
            <tr key={subcategory.id}>
              <td>{subcategory.name}</td>
              <td>{subcategory.category_name || <span style={{ color: '#9ca3af' }}>N/A</span>}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(subcategory)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Subcategoría">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(subcategory)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Subcategoría">
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