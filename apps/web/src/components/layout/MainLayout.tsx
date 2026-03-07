// File: apps/web/src/components/layout/MainLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavFooter } from './MobileNavFooter';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile nav — reservado para drawer futuro
  const [, setMobileNavOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Header onMobileMenuToggle={() => setMobileNavOpen(prev => !prev)} />

      <div className={styles.body}>
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {/* Botón colapso — solo desktop */}
        <button
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className={`${styles.collapseBtn} ${isSidebarCollapsed ? styles.collapseBtnCollapsed : ''}`}
          aria-label="Colapsar sidebar"
        >
          <i className={isSidebarCollapsed ? 'bx bx-chevron-right' : 'bx bx-chevron-left'}></i>
        </button>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* Nav footer mobile/tablet */}
      <MobileNavFooter />
    </div>
  );
};