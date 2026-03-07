// File: apps/web/src/pages/routes-management/route-detail/EditRouteWaypointList.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { EditRouteWaypointItem, type EditableWaypoint } from './EditRouteWaypointItem';
import { EditRouteAddWaypoint } from './EditRouteAddWaypoint';
import type { FarmOption } from './useEditRouteData';
import styles from './EditRouteModal.module.css';

interface Props {
  waypoints: EditableWaypoint[];
  farms: FarmOption[];
  onWaypointsChange: (waypoints: EditableWaypoint[]) => void;
}

export const EditRouteWaypointList = ({ waypoints, farms, onWaypointsChange }: Props) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = waypoints.findIndex(w => w.id === active.id);
    const newIndex = waypoints.findIndex(w => w.id === over.id);
    const reordered = arrayMove(waypoints, oldIndex, newIndex);
    onWaypointsChange(reordered);
  };

  const handleRemove = (id: string) => {
    onWaypointsChange(waypoints.filter(w => w.id !== id));
  };

  const handleAmountChange = (id: string, amount: number) => {
    onWaypointsChange(waypoints.map(w => w.id === id ? { ...w, plannedPickupAmount: amount } : w));
  };

  const handleZoneChange = (id: string, zone: string) => {
    onWaypointsChange(waypoints.map(w => w.id === id ? { ...w, zone } : w));
  };

  const handleAdd = (newWaypoint: EditableWaypoint) => {
    onWaypointsChange([...waypoints, newWaypoint]);
  };

  const existingFarmIds = waypoints.map(w => w.farmId);

  return (
    <div className={styles.waypointListSection}>
      <div className={styles.waypointListHeader}>
        <span className={styles.waypointListTitle}>
          Paradas ({waypoints.length})
        </span>
        <span className={styles.waypointListTotal}>
          {waypoints.reduce((sum, w) => sum + w.plannedPickupAmount, 0).toLocaleString()} L
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={waypoints.map(w => w.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.waypointList}>
            {waypoints.map((wp, idx) => (
              <EditRouteWaypointItem
                key={wp.id}
                waypoint={wp}
                index={idx}
                onRemove={handleRemove}
                onAmountChange={handleAmountChange}
                onZoneChange={handleZoneChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <EditRouteAddWaypoint
        farms={farms}
        existingFarmIds={existingFarmIds}
        onAdd={handleAdd}
      />
    </div>
  );
};