// File: apps/web/src/pages/routes-management/route-detail/EditRouteWaypointItem.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './EditRouteModal.module.css';

export interface EditableWaypoint {
  id: string;
  farmId: string;
  farmName: string;
  ruc: string;
  zone: string;
  sapRouteId: string;
  plannedPickupAmount: number;
  latitude: number;
  longitude: number;
}

interface Props {
  waypoint: EditableWaypoint;
  index: number;
  onRemove: (id: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  onZoneChange: (id: string, zone: string) => void;
}

export const EditRouteWaypointItem = ({ waypoint, index, onRemove, onAmountChange, onZoneChange }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as any
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.waypointItem}>
      <div className={styles.waypointDragHandle} {...attributes} {...listeners}>
        <i className="bx bx-grid-vertical"></i>
      </div>

      <div className={styles.waypointOrder}>{index + 1}</div>

      <div className={styles.waypointInfo}>
        <span className={styles.waypointName}>{waypoint.farmName}</span>
        <span className={styles.waypointRuc}>{waypoint.ruc}</span>
      </div>

      <div className={styles.waypointFields}>
        <input
          type="text"
          className={styles.waypointFieldSmall}
          value={waypoint.zone}
          onChange={e => onZoneChange(waypoint.id, e.target.value)}
          placeholder="Zona"
        />
        <div className={styles.waypointAmountWrapper}>
          <input
            type="number"
            className={styles.waypointFieldSmall}
            value={waypoint.plannedPickupAmount || ''}
            onChange={e => onAmountChange(waypoint.id, Number(e.target.value) || 0)}
            placeholder="Litros"
          />
          <span className={styles.waypointAmountUnit}>L</span>
        </div>
      </div>

      <button
        type="button"
        className={styles.waypointRemoveBtn}
        onClick={() => onRemove(waypoint.id)}
        title="Eliminar parada"
      >
        <i className="bx bx-trash"></i>
      </button>
    </div>
  );
};