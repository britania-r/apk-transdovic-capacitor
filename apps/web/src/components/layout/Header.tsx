// File: apps/web/src/components/layout/Header.tsx
import { useState, useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { MobileMenuDropdown } from './MobileMenuDropdown';
import styles from './Header.module.css';

export const Header = () => {
  const { data: profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const initials = profile?.first_name
    ? profile.first_name.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className={styles.header}>
      {/* Left: logo */}
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <i className="bx bxs-truck"></i>
          </div>
          <span className={styles.logoText}>Transdovic</span>
        </div>
      </div>

      {/* Right */}
      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          <i className={theme === 'light' ? 'bx bx-moon' : 'bx bx-sun'}></i>
        </button>

        <div className={styles.divider} />

        {/* Perfil — oculto en mobile */}
        <div className={styles.profile}>
          <div className={styles.profileTexts}>
            <span className={styles.profileName}>
              {profile?.first_name || 'Usuario'}
            </span>
            <span className={styles.profileRole}>
              {profile?.role || '—'}
            </span>
          </div>
          <div className={styles.avatar}>{initials}</div>
        </div>

        {/* Hamburger — solo mobile */}
        <div className={styles.menuWrapper}>
          <button
            ref={btnRef}
            className={`${styles.mobileMenuBtn} ${isMenuOpen ? styles.mobileMenuBtnActive : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
          >
            <i className={`bx ${isMenuOpen ? 'bx-x' : 'bx-menu'}`}></i>
          </button>

          <MobileMenuDropdown
            isOpen={isMenuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={btnRef}
            userRole={profile?.role}
          />
        </div>
      </div>
    </header>
  );
};