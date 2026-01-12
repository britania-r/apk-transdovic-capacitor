// File: apps/web/src/pages/users/UserTable.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserProfile } from './UsersPage';
import styles from './UserTable.module.css';

interface Props {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

export const UserTable = ({ users, onEdit, onDelete }: Props) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Rol</th>
            <th>DNI</th>
            <th>Fecha de Nacimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{`${user.first_name} ${user.paternal_last_name}`}</td>
              <td>{user.role}</td>
              <td>{user.dni}</td>
              <td>
                {format(parseISO(user.date_of_birth), 'dd/MM/yyyy', { locale: es })}
              </td>
              <td>
                <div className={styles.actions}>
                  <Link to={`/users/${user.id}`} className={`${styles.actionButton} ${styles.detailsButton}`} title="Ver Detalles">
                    <i className='bx bx-show'></i>
                  </Link>
                  <button onClick={() => onEdit(user)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Usuario">
                    <i className='bx bx-pencil'></i>
                  </button>
                  <button onClick={() => onDelete(user)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Usuario">
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