import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

  const isAdmin = profile?.role === 'Gerente' || profile?.role === 'Administrador';

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <nav className={styles.navMenu}>
        <NavLink to="/" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-dashboard'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Dashboard</span>}
        </NavLink>
        
        {/* === MÓDULO FINANCIERO UNIFICADO === */}
        <NavLink to="/operaciones" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <i className='bx bx-money'></i>
            {!isCollapsed && <span className={styles.linkLabel}>Operaciones</span>}
        </NavLink>

        <NavLink to="/account-statement" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-spreadsheet'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Estado de Cuenta</span>}
        </NavLink>

        <NavLink to="/company-accounts" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <i className='bx bxs-bank'></i>
            {!isCollapsed && <span className={styles.linkLabel}>Cuentas y Cajas</span>}
        </NavLink>

        <div className={styles.divider}></div> {/* Opcional: Separador visual en CSS */}

        {/* === MÓDULO LOGÍSTICO === */}
        <NavLink to="/purchases" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-shopping-bag'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Compras</span>}
        </NavLink>

        <NavLink to="/peajes" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-receipt'></i> 
          {!isCollapsed && <span className={styles.linkLabel}>Peajes</span>}
        </NavLink>

        <NavLink to="/farms" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-store-alt'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Granjas</span>}
        </NavLink>

        <NavLink to="/routes" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-map-alt'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Rutas</span>}
        </NavLink>

        <NavLink to="/vehicles" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-truck'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Unidades</span>}
        </NavLink>

        <NavLink to="/assets"className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <i className='bx bxs-archive'></i>
            {!isCollapsed && <span className={styles.linkLabel}>Activos Fijos</span>}
        </NavLink>

        {/* === CONFIGURACIÓN === */}
        <NavLink to="/suppliers" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-user-detail'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Proveedores</span>}
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <i className='bx bxs-package'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Productos</span>}
        </NavLink>

        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <i className='bx bxs-group'></i>
            {!isCollapsed && <span className={styles.linkLabel}>Usuarios</span>}
          </NavLink>
        )}

        <NavLink to="/settings" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <i className='bx bxs-cog'></i>
            {!isCollapsed && <span className={styles.linkLabel}>Configuración</span>}
        </NavLink>
      </nav>

      <div className={styles.logoutSection}>
        <button onClick={signOut} className={`${styles.navLink} ${styles.logoutButton}`}>
          <i className='bx bx-log-out'></i>
          {!isCollapsed && <span className={styles.linkLabel}>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};