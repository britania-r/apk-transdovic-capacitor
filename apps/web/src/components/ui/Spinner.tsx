// File: apps/web/src/components/ui/Spinner.tsx

import styles from './Spinner.module.css';

interface SpinnerProps {
  fullPage?: boolean;
}

export const Spinner = ({ fullPage = false }: SpinnerProps) => {
  // Si es 'fullPage', lo envolvemos en un contenedor que lo centra en toda la pantalla.
  if (fullPage) {
    return (
      <div className={styles.spinnerOverlay}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  // Si no, simplemente devolvemos el spinner para usarlo en línea (dentro de un botón, etc.).
  return <div className={styles.loader}></div>;
};