// File: apps/web/src/pages/settings/SettingsPage.tsx
import { NavLink, Outlet } from 'react-router-dom';
import styles from './SettingsPage.module.css';

const TABS = [
  { to: '/settings/categories', label: 'Categorías', icon: 'bx bx-category' },
  { to: '/settings/subcategories', label: 'Subcategorías', icon: 'bx bx-subdirectory-right' },
  { to: '/settings/botiquin', label: 'Botiquín', icon: 'bx bx-first-aid' },
  { to: '/settings/servicios', label: 'Servicios', icon: 'bx bx-wrench' },
  { to: '/settings/cities', label: 'Ciudades', icon: 'bx bx-map' },
  { to: '/settings/units', label: 'Unidades', icon: 'bx bx-ruler' },
  { to: '/settings/banks', label: 'Bancos', icon: 'bx bxs-bank' },
];

export const SettingsPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuraciones</h1>
        <nav className={styles.tabNav}>
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `${styles.tabLink} ${isActive ? styles.tabActive : ''}`
              }
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.tabContent}>
        <Outlet />
      </div>
    </div>
  );
};