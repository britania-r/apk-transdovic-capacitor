// File: apps/web/src/components/layout/Header.tsx
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import styles from './Header.module.css';

export const Header = () => {
  const { data: profile } = useProfile();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <i className='bx bxs-truck'></i>
          <span>Transdovic</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <button onClick={toggleTheme} className={styles.iconButton}>
          <i className={theme === 'light' ? 'bx bx-moon' : 'bx bx-sun'}></i>
        </button>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{profile?.first_name || 'Usuario'}</span>
          <span className={styles.profileRole}>{profile?.role || '...'}</span>
        </div>
      </div>
    </header>
  );
};