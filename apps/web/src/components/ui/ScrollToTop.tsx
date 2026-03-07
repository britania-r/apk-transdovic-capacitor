// File: apps/web/src/components/ui/ScrollToTop.tsx
import { useState, useEffect } from 'react';
import styles from './ScrollToTop.module.css';

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollUp}
      className={`${styles.btn} ${visible ? styles.visible : ''}`}
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      <i className="bx bx-chevron-up"></i>
    </button>
  );
};