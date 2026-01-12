// File: apps/web/src/pages/settings/CategoryTable.tsx

import type { Category } from './CategoriesPage'; // Importaremos este tipo después
import styles from './CategoryTable.module.css';

interface Props {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryTable = ({ categories, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(category)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Categoría">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(category)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Categoría">
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