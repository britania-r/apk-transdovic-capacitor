// File: apps/web/src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isCollapsed: boolean;
}

interface NavItem { to: string; icon: string; label: string; }
interface NavGroup { title: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Finanzas',
    items: [
      { to: '/operaciones',       icon: 'bx bx-money',       label: 'Operaciones'      },
      { to: '/petty-cash',        icon: 'bx bx-box',          label: 'Caja chica'       },
      { to: '/account-statement', icon: 'bx bxs-spreadsheet', label: 'Estado de cuenta' },
      { to: '/company-accounts',  icon: 'bx bxs-bank',        label: 'Cuentas y cajas'  },
    ],
  },
  {
    title: 'Logística',
    items: [
      { to: '/purchases',     icon: 'bx bxs-shopping-bag', label: 'Compras'       },
      { to: '/salidas',        icon: 'bx bx-export',        label: 'Salidas'       },
      { to: '/vencimientos',   icon: 'bx bx-calendar-x',    label: 'Vencimientos'  },
      { to: '/peajes',         icon: 'bx bxs-receipt',      label: 'Peajes'        },
      { to: '/farms',          icon: 'bx bxs-store-alt',    label: 'Establos'      },
      { to: '/routes',         icon: 'bx bxs-map-alt',      label: 'Rutas'         },
      { to: '/vehicles',       icon: 'bx bxs-truck',        label: 'Unidades'      },
      { to: '/assets',         icon: 'bx bxs-archive',      label: 'Activos fijos' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/suppliers', icon: 'bx bxs-user-detail', label: 'Proveedores' },
      { to: '/products',  icon: 'bx bxs-package',     label: 'Productos'   },
    ],
  },
];

const DRIVER_NAV: NavGroup[] = [
  {
    title: 'Mis asignaciones',
    items: [
      { to: '/mis-rutas', icon: 'bx bxs-map-alt', label: 'Mis rutas' },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/users',    icon: 'bx bxs-group', label: 'Usuarios'      },
  { to: '/settings', icon: 'bx bxs-cog',   label: 'Configuración' },
];

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isAdmin = profile?.role === 'Gerente' || profile?.role === 'Administrador';
  const isDriver = profile?.role === 'Conductor carga pesada';

  const navGroups = isDriver ? DRIVER_NAV : NAV_GROUPS;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Dashboard */}
        <div className={styles.topSection}>
          <NavLink to="/" end className={linkClass}>
            <i className="bx bxs-dashboard"></i>
            {!isCollapsed && <span className={styles.label}>Dashboard</span>}
            {isCollapsed  && <span className={styles.tooltip}>Dashboard</span>}
          </NavLink>
        </div>

        {/* Grupos */}
        <nav className={styles.nav}>
          {navGroups.map(group => (
            <div key={group.title} className={styles.group}>
              {!isCollapsed
                ? <span className={styles.groupTitle}>{group.title}</span>
                : <div className={styles.groupDivider} />
              }
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <i className={item.icon}></i>
                  {!isCollapsed && <span className={styles.label}>{item.label}</span>}
                  {isCollapsed  && <span className={styles.tooltip}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}

          {isAdmin && (
            <div className={styles.group}>
              {!isCollapsed
                ? <span className={styles.groupTitle}>Administración</span>
                : <div className={styles.groupDivider} />
              }
              {ADMIN_ITEMS.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <i className={item.icon}></i>
                  {!isCollapsed && <span className={styles.label}>{item.label}</span>}
                  {isCollapsed  && <span className={styles.tooltip}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className={styles.footer}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`${styles.navLink} ${styles.logoutBtn}`}
          >
            <i className="bx bx-log-out"></i>
            {!isCollapsed && <span className={styles.label}>Cerrar sesión</span>}
            {isCollapsed  && <span className={styles.tooltip}>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={signOut}
        title="Cerrar sesión"
        message="¿Estás seguro que deseas cerrar sesión? Se perderá cualquier cambio no guardado."
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};