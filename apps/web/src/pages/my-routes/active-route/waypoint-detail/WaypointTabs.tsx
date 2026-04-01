// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/WaypointTabs.tsx
import styles from './WaypointDetailPage.module.css';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tanksCount: number;
}

const TABS = [
  { key: 'datos', label: 'Datos', icon: 'bx bx-data' },
  { key: 'precintos', label: 'Precintos', icon: 'bx bx-lock-alt' },
  { key: 'guias', label: 'Guías', icon: 'bx bx-file' },
];

export const WaypointTabs = ({ activeTab, onTabChange, tanksCount }: Props) => {
  return (
    <div className={styles.tabsContainer}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
        >
          <i className={tab.icon}></i>
          <span>{tab.label}</span>
          {tab.key === 'datos' && tanksCount > 0 && (
            <span className={styles.tabBadge}>{tanksCount}</span>
          )}
        </button>
      ))}
    </div>
  );
};