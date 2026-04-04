// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/DataTab.tsx
import { useState } from 'react';
import { useTankReadings } from '../../hooks/useTankReadings';
import type { FarmTankWithType } from '../../hooks/useTankReadings';
import { TankSelector } from './TankSelector';
import { TankForm } from './TankForm';
import styles from '../WaypointDetailPage.module.css';

interface Props {
  collectionId: string | undefined;
  tanks: FarmTankWithType[];
  isCompleted: boolean;
  onEnsureCollection: () => Promise<string>;
  // Contexto para la foto
  routeId: string;
  waypointId: string;
  plate: string;
  driverName: string;
  farmName: string;
}

export const DataTab = ({
  collectionId, tanks, isCompleted, onEnsureCollection,
  routeId, waypointId, plate, driverName, farmName,
}: Props) => {
  const [activeTankIndex, setActiveTankIndex] = useState(0);
  const { readings, saveReading, isSaving, getReadingForTank } = useTankReadings(collectionId);

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
      <TankSelector
        tanks={tanks}
        activeTankIndex={activeTankIndex}
        onTankChange={setActiveTankIndex}
        readings={readings}
      />

      {activeTank && (
        <TankForm
          key={activeTank.id}
          tank={activeTank}
          reading={activeReading}
          collectionId={collectionId}
          isCompleted={isCompleted}
          onSave={async (input) => {
            const activeCollectionId = await onEnsureCollection();
            await saveReading({
              tankId: activeTank.id,
              input,
              collectionId: activeCollectionId,
            });
          }}
          isSaving={isSaving}
          routeId={routeId}
          waypointId={waypointId}
          plate={plate}
          driverName={driverName}
          farmName={farmName}
        />
      )}
    </div>
  );
};