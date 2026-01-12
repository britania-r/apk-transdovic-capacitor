// File: apps/web/src/components/layout/MainLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className={styles.layoutContainer}>
      <Header />
      <div className={styles.contentWrapper}>
        <Sidebar isCollapsed={isSidebarCollapsed} />
        
        {/* El botón de colapso ahora vive aquí, en el layout principal */}
        <button
          onClick={toggleSidebar}
          className={`${styles.collapseButton} ${isSidebarCollapsed ? styles.collapsed : ''}`}
        >
          <i className={isSidebarCollapsed ? 'bx bx-chevron-right' : 'bx bx-chevron-left'}></i>
        </button>

        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};