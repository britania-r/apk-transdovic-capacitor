// File: apps/web/src/pages/routes-management/route-detail/EditRouteGeneralForm.tsx
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { VehicleOption, DriverOption } from './useEditRouteData';
import styles from './EditRouteModal.module.css';

interface Props {
  driverId: string;
  vehicleId: string;
  precintos: string;
  startTime: string;
  endTime: string;
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  onDriverChange: (id: string) => void;
  onVehicleChange: (id: string) => void;
  onPrecintosChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
}

export const EditRouteGeneralForm = ({
  driverId, vehicleId, precintos, startTime, endTime,
  drivers, vehicles,
  onDriverChange, onVehicleChange, onPrecintosChange, onStartTimeChange, onEndTimeChange
}: Props) => {
  const driverOptions = drivers.map(d => ({
    value: d.id,
    label: d.first_name
  }));

  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: v.plate,
    sublabel: `${v.capacity_kg.toLocaleString()} kg`
  }));

  return (
    <div className={styles.generalForm}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <SearchableSelect
            label="Conductor"
            placeholder="Buscar conductor..."
            options={driverOptions}
            value={driverId}
            onChange={onDriverChange}
          />
        </div>
        <div className={styles.formField}>
          <SearchableSelect
            label="Vehículo"
            placeholder="Buscar placa..."
            options={vehicleOptions}
            value={vehicleId}
            onChange={onVehicleChange}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label className={styles.inputLabel}>Precintos</label>
          <input
            type="text"
            className={styles.textInput}
            value={precintos}
            onChange={e => onPrecintosChange(e.target.value)}
            placeholder="Ej: 7 unidades"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.inputLabel}>Hora salida</label>
          <input
            type="text"
            className={styles.textInput}
            value={startTime}
            onChange={e => onStartTimeChange(e.target.value)}
            placeholder="Ej: 6:00:00 a. m."
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.inputLabel}>Hora llegada</label>
          <input
            type="text"
            className={styles.textInput}
            value={endTime}
            onChange={e => onEndTimeChange(e.target.value)}
            placeholder="Ej: 1:00:00 p. m."
          />
        </div>
      </div>
    </div>
  );
};