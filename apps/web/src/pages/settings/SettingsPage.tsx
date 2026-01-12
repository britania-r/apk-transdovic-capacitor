// File: apps/web/src/pages/settings/SettingsPage.tsx

import { NavLink, Outlet } from 'react-router-dom';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
  return (
    <div className={styles.settingsContainer}>
      <header className={styles.header}>
        <h1>Configuraciones</h1>
        <nav className={styles.tabNav}>
          <NavLink 
            to="/settings/categories"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Categorías
          </NavLink>

          <NavLink 
            to="/settings/subcategories"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Subcategorías
          </NavLink>

          {/* === NUEVA PESTAÑA PARA BOTIQUÍN AQUÍ === */}
          <NavLink 
            to="/settings/botiquin" // 1. Apunta a la nueva ruta
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Botiquín {/* 2. El texto que verá el usuario */}
          </NavLink>
          <NavLink 
            to="/settings/servicios"className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}>
            Servicios
          </NavLink>
          <NavLink 
            to="/settings/cities"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Ciudades
          </NavLink>
          <NavLink 
            to="/settings/units"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Unidades
          </NavLink>
          <NavLink 
            to="/settings/banks"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Bancos
          </NavLink>
          <NavLink 
            to="/settings/itf"className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}>
            ITF
          </NavLink>
        </nav>
      </header>

      <div className={styles.tabContent}>
        {/* 3. Aquí se renderizará tu <BotiquinPage /> cuando la ruta sea la correcta */}
        <Outlet /> 
      </div>
    </div>
  );
};