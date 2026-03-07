// File: apps/web/src/components/layout/MobileMenuDropdown.tsx
import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './MobileMenuDropdown.module.css';

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
      { label: 'Dashboard',   icon: 'bx-home-alt',   to: '/' },
    ],
  },
  {
    group: 'Finanzas',
    items: [
      { label: 'Compras',     icon: 'bx-cart',       to: '/purchases' },
      { label: 'Proveedores', icon: 'bx-store-alt',  to: '/suppliers' },
    ],
  },
  {
    group: 'Logística',
    items: [
      { label: 'Rutas',       icon: 'bx-map-alt',    to: '/routes' },
      { label: 'Operaciones', icon: 'bx-git-branch', to: '/operaciones' },
      { label: 'Vehículos',   icon: 'bx-car',        to: '/vehicles' },
    ],
  },
  {
    group: 'Gestión',
    items: [
      { label: 'Productos',   icon: 'bx-package',    to: '/products' },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Usuarios',      icon: 'bx-group',  to: '/users' },
  { label: 'Configuración', icon: 'bx-cog',    to: '/settings' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
  userRole?: string;
}

const isAdmin = (role?: string) =>
  role === 'Administrador' || role === 'Gerente';

export const MobileMenuDropdown = ({ isOpen, onClose, anchorRef, userRole }: Props) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.group} className={styles.group}>
            {/* Solo mostrar label de grupo si tiene más de 1 ítem o no es el primero */}
            <span className={styles.groupLabel}>{group.group}</span>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `${styles.item} ${isActive ? styles.itemActive : ''}`
                }
              >
                <i className={`bx ${item.icon} ${styles.itemIcon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
            {/* Separador entre grupos (no al final) */}
            {gi < NAV_GROUPS.length - 1 && <div className={styles.separator} />}
          </div>
        ))}

        {/* Admin */}
        {isAdmin(userRole) && (
          <div className={styles.group}>
            <div className={styles.separator} />
            <span className={styles.groupLabel}>Administración</span>
            {ADMIN_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `${styles.item} ${isActive ? styles.itemActive : ''}`
                }
              >
                <i className={`bx ${item.icon} ${styles.itemIcon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Logout */}
        <div className={styles.group}>
          <div className={styles.separator} />
          <button onClick={handleLogout} className={`${styles.item} ${styles.itemDanger}`}>
            <i className="bx bx-log-out" style={{ fontSize: '1rem' }}></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </div>
  );
};