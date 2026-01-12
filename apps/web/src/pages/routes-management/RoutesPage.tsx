import { NavLink, Outlet } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import styles from '../../pages/settings/SettingsPage.module.css'; 

const RoutesPageLayout = () => {
  return (
    <div>
      <header className={styles.header}>
        <nav className={styles.tabNav}>
          <NavLink
            to="/routes/create"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Crear Ruta
          </NavLink>
          <NavLink
            to="/routes/list"
            className={({ isActive }) => isActive ? `${styles.tabLink} ${styles.active}` : styles.tabLink}
          >
            Rutas Guardadas
          </NavLink>
        </nav>
      </header>

      <div className={styles.tabContent}>
        <Outlet />
      </div>
    </div>
  );
};

export const RoutesPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <RoutesPageLayout />
  </APIProvider>
);