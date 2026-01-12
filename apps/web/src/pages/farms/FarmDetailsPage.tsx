// File: apps/web/src/pages/farms/FarmDetailsPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import styles from './FarmDetailsPage.module.css';

// Importa los nuevos componentes refactorizados
import { ManagersSection } from './ManagersSection';
import { TanksSection } from './TanksSection';

// --- Exportamos los tipos aquí para que los hijos puedan importarlos ---
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
    excel_formula: string | null; // <-- Campo nuevo
    cities: { name: string } | null;
  };
  managers: FarmManager[];
  tanks: FarmTank[];
}

export const FarmDetailsPage = () => {
  const { farmId } = useParams<{ farmId: string }>();
  
  const { data, isLoading, error } = useQuery<FarmDetailsData | null, Error>({
    queryKey: ['farm_details', farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const supabase = getSupabase();
      
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select(`*, cities(name), farm_managers(*), farm_tanks(*)`)
        .eq('id', farmId)
        .single();

      if (farmError) throw new Error(farmError.message);

      return { 
        farm: farmData, 
        managers: farmData.farm_managers || [], 
        tanks: farmData.farm_tanks || [] 
      };
    },
  });

  if (isLoading) return <p>Cargando detalles de la granja...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;
  if (!data?.farm) return <p>Granja no encontrada.</p>;

  const { farm, managers, tanks } = data;

  return (
    <div className={styles.pageContainer}>
      <Link to="/farms" className={styles.backLink}><i className='bx bx-arrow-back'></i> Volver a Granjas</Link>

      <section className={styles.detailsCard}>
        <h1>{farm.name}</h1>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}><span className={styles.label}>RUC</span><span className={styles.value}>{farm.ruc}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Ciudad</span><span className={styles.value}>{farm.cities?.name}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Dirección</span><span className={styles.value}>{farm.address || '-'}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Observaciones</span><span className={styles.value}>{farm.notes || '-'}</span></div>
          
          {/* --- CAMPO DE FÓRMULA AÑADIDO --- */}
          <div className={`${styles.detailItem} ${styles.fullWidth}`}>
            <span className={styles.label}>Fórmula de Conversión</span>
            <span className={styles.valueFormula}>{farm.excel_formula || 'No definida'}</span>
          </div>
        </div>
      </section>

      <div className={styles.columnsLayout}>
        <div className={styles.mainColumn}>
          <ManagersSection farmId={farm.id} initialManagers={managers} />
        </div>
        <div className={styles.sideColumn}>
          <TanksSection farmId={farm.id} initialTanks={tanks} />
        </div>
      </div>
    </div>
  );
};