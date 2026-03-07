// File: apps/web/src/pages/users/UserTable.tsx
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserProfile } from './UsersPage';
import styles from '../../components/ui/Table.module.css'

interface Props {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

const ROLE_STYLES: Record<string, string> = {
  'Gerente':                   styles.roleGerente,
  'Administrador':             styles.roleAdmin,
  'Conductor carga pesada':    styles.roleConductor,
  'Asistente administrativo':  styles.roleAsistente,
  'Asistente de procesos':     styles.roleAsistente,
  'Conductor de patio':        styles.roleConductor,
};

const getRoleInitial = (role: string) => role.charAt(0).toUpperCase();

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const UserTable = ({ users, onEdit, onDelete }: Props) => {
  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>DNI</th>
              <th>Fecha de nacimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                {/* Usuario: avatar + nombre + email */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.first_name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>

                {/* Rol badge */}
                <td>
                  <span className={`${styles.roleBadge} ${ROLE_STYLES[user.role] ?? styles.roleDefault}`}>
                    {user.role}
                  </span>
                </td>

                <td className={styles.monoCell}>{user.dni}</td>

                <td>{formatDate(user.date_of_birth)}</td>

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/users/${user.id}`}
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      title="Ver detalles"
                    >
                      <i className="bx bx-show"></i>
                    </Link>
                    <button
                      onClick={() => onEdit(user)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(user)}
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
        {users.map(user => (
          <div key={user.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.first_name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${ROLE_STYLES[user.role] ?? styles.roleDefault}`}>
                {getRoleInitial(user.role)}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>DNI</span>
                <span className={styles.metaValue}>{user.dni}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Nacimiento</span>
                <span className={styles.metaValue}>{formatDate(user.date_of_birth)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Rol</span>
                <span className={styles.metaValue}>{user.role}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link to={`/users/${user.id}`} className={`${styles.cardBtn} ${styles.viewBtn}`}>
                <i className="bx bx-show"></i> Ver
              </Link>
              <button onClick={() => onEdit(user)} className={`${styles.cardBtn} ${styles.editBtn}`}>
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button onClick={() => onDelete(user)} className={`${styles.cardBtn} ${styles.deleteBtn}`}>
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};