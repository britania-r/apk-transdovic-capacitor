// File: apps/web/src/pages/routes-management/RoutePlanner.tsx

import Select from 'react-select';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Farm, SelectOption, TollAnalysis } from './CreateRoutePage';
import styles from './RoutePlanner.module.css';

// --- Componente Interno para cada item arrastrable ---
const SortableWaypoint = ({ waypoint, index, onRemove }: { waypoint: Farm, index: number, onRemove: (index: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: waypoint.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.waypointItem}>
      <div className={styles.waypointContent}>
        <button {...attributes} {...listeners} className={styles.dragHandle} title="Arrastrar para reordenar">
          <i className='bx bx-grid-vertical'></i>
        </button>
        <span className={styles.waypointName}>{waypoint.name}</span>
      </div>
      <button onClick={() => onRemove(index)} className={styles.removeButton} title="Eliminar parada">
        <i className='bx bx-x'></i>
      </button>
    </li>
  );
};

// --- Props del Componente Principal ---
interface RoutePlannerProps {
  driverOptions: SelectOption[];
  vehicleOptions: SelectOption[];
  farmOptions: SelectOption[];
  waypoints: Farm[];
  onDriverChange: (option: SelectOption | null) => void;
  onVehicleChange: (option: SelectOption | null) => void;
  onDateChange: (date: string) => void;
  onAddWaypoint: (option: SelectOption | null) => void;
  onRemoveWaypoint: (index: number) => void;
  onSave: () => void;
  routeMetrics: { distance: string; duration: string };
  tollAnalysis: TollAnalysis[];
  isSaving: boolean;
  driverSelectKey: number;
  vehicleSelectKey: number;
  routeDate: string;
}

// --- Componente Principal ---
export const RoutePlanner = ({
  driverOptions,
  vehicleOptions,
  farmOptions,
  waypoints,
  onDriverChange,
  onVehicleChange,
  onDateChange,
  onAddWaypoint,
  onRemoveWaypoint,
  onSave,
  routeMetrics,
  tollAnalysis,
  isSaving,
}: RoutePlannerProps) => {
  const totalTollCharges = tollAnalysis.reduce((sum, toll) => sum + toll.timesToCharge, 0);
  const uniqueTolls = tollAnalysis.length;

  return (
    <div className={styles.plannerContainer}>
      <h2>Crear Nueva Ruta</h2>
      
      <section className={styles.section}>
        <h3>1. Asignación</h3>
        <div className={styles.inputGroup}>
          <label>Conductor</label>
          <Select options={driverOptions} onChange={onDriverChange} isClearable isSearchable placeholder="Busca un conductor..." />
        </div>
        <div className={styles.inputGroup}>
          <label>Vehículo</label>
          <Select options={vehicleOptions} onChange={onVehicleChange} isClearable isSearchable placeholder="Busca un vehículo..." />
        </div>
        <div className={styles.inputGroup}>
          <label>Fecha de la Ruta</label>
          <input type="date" onChange={(e) => onDateChange(e.target.value)} required />
        </div>
      </section>

      <section className={styles.section}>
        <h3>2. Añadir Parada</h3>
        <Select
          options={farmOptions}
          onChange={onAddWaypoint}
          placeholder="Busca y añade una granja..."
          isSearchable
          value={null}
        />
      </section>
      
      <section className={`${styles.section} ${styles.waypointsSection}`}>
        <h3>3. Paradas ({waypoints.length})</h3>
        {waypoints.length > 0 ? (
          <ol className={styles.waypointList}>
            <SortableContext items={waypoints} strategy={verticalListSortingStrategy}>
              {waypoints.map((wp, index) => (
                <SortableWaypoint key={wp.id} waypoint={wp} index={index} onRemove={onRemoveWaypoint} />
              ))}
            </SortableContext>
          </ol>
        ) : (
          <p className={styles.emptyText}>Añade paradas desde el selector de arriba.</p>
        )}
      </section>

      {routeMetrics.distance && (
        <section className={styles.metrics}>
          <div><strong>Distancia Total:</strong> {routeMetrics.distance}</div>
          <div><strong>Tiempo Estimado:</strong> {routeMetrics.duration}</div>
          <div>
            <strong>Peajes:</strong> {uniqueTolls} {uniqueTolls === 1 ? 'peaje' : 'peajes'} - {totalTollCharges} {totalTollCharges === 1 ? 'cobro' : 'cobros'}
          </div>
        </section>
      )}

      <button onClick={onSave} className={styles.saveButton} disabled={isSaving || waypoints.length < 1}>
        {isSaving ? 'Guardando...' : 'Guardar y Asignar Ruta'}
      </button>
    </div>
  );
};