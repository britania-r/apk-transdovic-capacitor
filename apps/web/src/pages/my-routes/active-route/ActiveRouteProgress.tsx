// File: apps/web/src/pages/my-routes/active-route/ActiveRouteProgress.tsx
import styles from './ActiveRoutePage.module.css';

interface Props {
  total: number;
  completed: number;
}

export const ActiveRouteProgress = ({ total, completed }: Props) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Progreso de recolección</span>
        <span className={styles.progressCount}>
          {completed}/{total} paradas
        </span>
      </div>
      <div className={styles.progressBarTrack}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};