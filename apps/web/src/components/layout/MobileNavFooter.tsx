// File: apps/web/src/components/layout/MobileNavFooter.tsx
import { NavLink } from 'react-router-dom';
import styles from './MobileNavFooter.module.css';

const NAV_ITEMS = [
  { to: '/',           icon: 'bx bxs-dashboard', label: 'Inicio' },
  { to: '/operaciones',icon: 'bx bx-money',       label: 'Operaciones' },
  { to: '/routes',     icon: 'bx bxs-map-alt',    label: 'Rutas' },
  { to: '/settings',   icon: 'bx bxs-cog',         label: 'Config' },
];

export const MobileNavFooter = () => {
  return (
    <nav className={styles.navFooter}>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <i className={item.icon}></i>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};