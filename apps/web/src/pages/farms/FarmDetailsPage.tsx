// File: apps/web/src/pages/farms/FarmDetailsPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

import { TanksSection } from './TanksSection';
import { ManagersSection } from './ManagersSection';
import styles from './FarmDetailsPage.module.css';

// --- Tipos exportados ---
export interface FarmManager {
  id: string;
  name: string;
  phone: string;
  farm_id: string;
}

export interface FarmTank {
  id: string;
  name: string;
  farm_id: string;
}

interface FarmDetailsData {
  farm: {
    id: string;
    name: string;
    ruc: string;
    address: string | null;
    notes: string | null;
    cities: { name: string } | null;
  };
  managers: FarmManager[];
  tanks: FarmTank[];
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const FarmDetailsPage = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const [activeTab, setActiveTab] = useState<'tanks' | 'managers'>('tanks');

  const { data, isLoading, error } = useQuery<FarmDetailsData | null, Error>({
    queryKey: ['farm_details', farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const supabase = getSupabase();
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*, cities(name), farm_managers(*), farm_tanks(*)')
        .eq('id', farmId)
        .single();
      if (farmError) throw new Error(farmError.message);
      return {
        farm: farmData,
        managers: farmData.farm_managers || [],
        tanks: farmData.farm_tanks || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando granja...</span>
      </div>
    );
  }

  if (error || !data?.farm) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>{error ? error.message : 'Granja no encontrada'}</span>
      </div>
    );
  }

  const { farm, managers, tanks } = data;

  const TABS = [
    { key: 'tanks' as const, label: 'Tanques', icon: 'bx bx-cylinder', count: tanks.length },
    { key: 'managers' as const, label: 'Encargados', icon: 'bx bx-user', count: managers.length },
  ];

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/farms" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver a granjas
          </Link>
        </div>

        {/* Avatar + nombre */}
        <div className={styles.headerProfile}>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{farm.name}</h1>
            <span className={styles.headerSub}>{farm.ruc}</span>
          </div>
        </div>

        {/* Grid de datos rápidos */}
        <div className={styles.headerGrid}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>RUC</span>
            <span className={styles.headerValue}>{farm.ruc}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Ciudad</span>
            <span className={styles.headerValue}>{farm.cities?.name || '—'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Dirección</span>
            <span className={styles.headerValue}>{farm.address || '—'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Observaciones</span>
            <span className={styles.headerValue}>{farm.notes || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <i className="bx bx-cylinder"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Tanques</span>
            <span className={styles.statValue}>{tanks.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="bx bx-user"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Encargados</span>
            <span className={styles.statValue}>{managers.length}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={tab.icon}></i>
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'tanks' && (
            <TanksSection farmId={farm.id} initialTanks={tanks} />
          )}
          {activeTab === 'managers' && (
            <ManagersSection farmId={farm.id} initialManagers={managers} />
          )}
        </div>
      </div>
    </div>
  );
};