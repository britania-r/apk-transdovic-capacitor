// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/DataTab.tsx
import { useState, useEffect } from 'react';
import { useTankReadings } from '../../hooks/useTankReadings';
import type { FarmTankWithType } from '../../hooks/useTankReadings';
import { TankSelector } from './TankSelector';
import { TankForm } from './TankForm';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  collectionId: string | undefined;
  waypointId: string;
  routeId: string;
  farmId: string;
  tanks: FarmTankWithType[];
  isCompleted: boolean;
  onEnsureCollection: () => Promise<void>;
}

export const DataTab = ({ collectionId, waypointId, routeId, farmId, tanks, isCompleted, onEnsureCollection }: Props) => {
  const [activeTankIndex, setActiveTankIndex] = useState(0);
  const { readings, isLoading, saveReading, isSaving, getReadingForTank } = useTankReadings(collectionId);

  // Si no hay tanques
  if (tanks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-data"></i>
        <span>Esta granja no tiene tanques registrados</span>
      </div>
    );
  }

  const activeTank = tanks[activeTankIndex];
  const activeReading = activeTank ? getReadingForTank(activeTank.id) : undefined;

  return (
    <div className={styles.dataTabContainer}>
      {/* Selector de tanques */}
      <TankSelector
        tanks={tanks}
        activeTankIndex={activeTankIndex}
        onTankChange={setActiveTankIndex}
        readings={readings}
      />

      {/* Formulario del tanque activo */}
      {activeTank && (
        <TankForm
          key={activeTank.id}
          tank={activeTank}
          reading={activeReading}
          collectionId={collectionId}
          isCompleted={isCompleted}
          onSave={async (input) => {
            // Asegurar que la colección exista antes de guardar
            if (!collectionId) {
              await onEnsureCollection();
            }
            await saveReading({ tankId: activeTank.id, input });
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};