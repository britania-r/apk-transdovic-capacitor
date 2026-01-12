// File: apps/web/src/pages/settings/BotiquinTable.tsx

import type { BotiquinItem } from './BotiquinPage'; // Importamos el tipo de la nueva página
import styles from './CategoryTable.module.css'; // Nuevo archivo de estilos

interface Props {
  items: BotiquinItem[]; // Cambiado de 'categories' a 'items'
  onEdit: (item: BotiquinItem) => void;
  onDelete: (item: BotiquinItem) => void;
}

export const BotiquinTable = ({ items, onEdit, onDelete }: Props) => {
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
          {items.map((item) => ( // Mapeamos sobre 'items'
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(item)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Elemento">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(item)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Elemento">
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