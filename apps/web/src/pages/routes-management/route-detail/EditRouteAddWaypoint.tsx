// File: apps/web/src/pages/routes-management/route-detail/EditRouteAddWaypoint.tsx
import { useState } from 'react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { FarmOption } from './useEditRouteData';
import type { EditableWaypoint } from './EditRouteWaypointItem';
import styles from './EditRouteModal.module.css';

interface Props {
  farms: FarmOption[];
  existingFarmIds: string[];
  onAdd: (waypoint: EditableWaypoint) => void;
}

export const EditRouteAddWaypoint = ({ farms, existingFarmIds, onAdd }: Props) => {
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [amount, setAmount] = useState('');
  const [zone, setZone] = useState('');

  // Filtrar granjas que ya están en la ruta
  const availableFarms = farms.filter(f => !existingFarmIds.includes(f.id));

  const farmOptions = availableFarms.map(f => ({
    value: f.id,
    label: f.name,
    sublabel: f.ruc
  }));

  const handleAdd = () => {
    const farm = farms.find(f => f.id === selectedFarmId);
    if (!farm) return;

    const qty = Number(amount) || 0;
    if (qty <= 0) return;

    onAdd({
      id: crypto.randomUUID(),
      farmId: farm.id,
      farmName: farm.name,
      ruc: farm.ruc,
      zone: zone,
      sapRouteId: '',
      plannedPickupAmount: qty,
      latitude: farm.latitude,
      longitude: farm.longitude
    });

    setSelectedFarmId('');
    setAmount('');
    setZone('');
  };

  const isValid = selectedFarmId && Number(amount) > 0;

  return (
    <div className={styles.addWaypointSection}>
      <div className={styles.addWaypointRow}>
        <div className={styles.addWaypointFarm}>
          <SearchableSelect
            placeholder="Agregar granja..."
            options={farmOptions}
            value={selectedFarmId}
            onChange={setSelectedFarmId}
            emptyMessage="No hay granjas disponibles"
          />
        </div>

        <input
          type="text"
          className={styles.addWaypointInput}
          value={zone}
          onChange={e => setZone(e.target.value)}
          placeholder="Zona"
        />

        <input
          type="number"
          className={styles.addWaypointInput}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Litros *"
        />

        <button
          type="button"
          className={styles.addWaypointBtn}
          onClick={handleAdd}
          disabled={!isValid}
          title="Agregar parada"
        >
          <i className="bx bx-plus"></i>
        </button>
      </div>
    </div>
  );
};