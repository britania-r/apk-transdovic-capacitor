// File: apps/web/src/pages/assets/AssetsTable.tsx

import type { Asset } from './AssetsPage';
import styles from '../users/UserTable.module.css';

interface Props {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return 'S/ 0.00';
  }
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

export const AssetsTable = ({ assets, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Costo</th> {/* <-- CABECERA AÑADIDA */}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>
                <strong>{asset.name}</strong>
                <br />
                <small style={{ color: '#666' }}>{`${asset.brand || ''} ${asset.model || ''}`.trim() || ''}</small>
              </td>
              <td>{asset.category_name}</td>
              <td>{formatCurrency(asset.cost)}</td> {/* <-- DATO AÑADIDO */}
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(asset)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Activo">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(asset)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Activo">
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