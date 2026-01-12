// File: apps/web/src/pages/suppliers/SupplierTable.tsx

import { Link } from 'react-router-dom';
import type { SupplierInList } from './SuppliersPage'; // Importaremos este tipo después
import styles from '../users/UserTable.module.css'; // Reutilizamos estilos de tabla

interface Props {
  suppliers: SupplierInList[];
  onEdit: (supplier: SupplierInList) => void;
  onDelete: (supplier: SupplierInList) => void;
}

export const SupplierTable = ({ suppliers, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre Comercial</th>
            <th>Razón Social</th>
            <th>R.U.C.</th>
            <th>Ciudad</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.trade_name}</td>
              <td>{supplier.legal_name}</td>
              <td>{supplier.ruc}</td>
              <td>{supplier.city_name || '-'}</td>
              <td>{supplier.category_name || '-'}</td>
              <td>
                <div className={styles.actions}>
                  <Link to={`/suppliers/${supplier.id}`} className={`${styles.actionButton} ${styles.detailsButton}`} title="Ver Detalles">
                    <i className='bx bx-show'></i>
                  </Link>
                  <button onClick={() => onEdit(supplier)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Proveedor">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(supplier)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Proveedor">
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