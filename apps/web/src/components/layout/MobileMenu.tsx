// File: apps/web/src/components/layout/MobileMenu.tsx
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // ajusta según tu hook
import styles from './MobileMenu.module.css';

interface NavItem {
  label: string;
  icon: string;
  to: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Principal',
    items: [
      { label: 'Dashboard',    icon: 'bx-home-alt',      to: '/' },
    ],
  },
  {
    group: 'Finanzas',
    items: [
      { label: 'Compras',      icon: 'bx-cart',          to: '/purchases' },
      { label: 'Proveedores',  icon: 'bx-store-alt',     to: '/suppliers' },
    ],
  },
  {
    group: 'Logística',
    items: [
      { label: 'Rutas',        icon: 'bx-map-alt',       to: '/routes' },
      { label: 'Operaciones',  icon: 'bx-git-branch',    to: '/operaciones' },
      { label: 'Vehículos',    icon: 'bx-car',           to: '/vehicles' },
    ],
  },
  {
    group: 'Gestión',
    items: [
      { label: 'Productos',    icon: 'bx-package',       to: '/products' },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Usuarios',       icon: 'bx-group',         to: '/users' },
  { label: 'Configuración',  icon: 'bx-cog',           to: '/settings' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'Administrador' || profile?.role === 'Gerente';

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Panel dropdown */}
      <div className={styles.panel}>
        {/* Grupos de navegación */}
        <nav className={styles.nav}>
          {NAV_GROUPS.map(group => (
            <div key={group.group} className={styles.group}>
              <span className={styles.groupLabel}>{group.group}</span>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <i className={`bx ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {/* Admin */}
          {isAdmin && (
            <div className={styles.group}>
              <span className={styles.groupLabel}>Administración</span>
              {ADMIN_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <i className={`bx ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Footer del menú */}
        <div className={styles.menuFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <i className="bx bx-log-out"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};