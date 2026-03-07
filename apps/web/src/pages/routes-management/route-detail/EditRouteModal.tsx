// File: apps/web/src/pages/routes-management/route-detail/EditRouteModal.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { useEditRouteData } from './useEditRouteData';
import { EditRouteGeneralForm } from './EditRouteGeneralForm';
import { EditRouteWaypointList } from './EditRouteWaypointList';
import { EditRouteMapPreview } from './EditRouteMapPreview';
import type { RouteDetail } from './useRouteDetail';
import type { EditableWaypoint } from './EditRouteWaypointItem';
import styles from './EditRouteModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  route: RouteDetail;
}

export const EditRouteModal = ({ isOpen, onClose, route }: Props) => {
  const { vehicles, drivers, farms, isLoading: isLoadingData } = useEditRouteData();
  const queryClient = useQueryClient();

  // Estado editable
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [precintos, setPrecintos] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [waypoints, setWaypoints] = useState<EditableWaypoint[]>([]);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && route) {
      setDriverId(route.driver ? findDriverId(route.driver.first_name) : '');
      setVehicleId(route.vehicle ? findVehicleId(route.vehicle.plate) : '');
      setPrecintos(route.precintos_count || '');
      setStartTime(route.programed_start_time || '');
      setEndTime(route.programed_arrival_time || '');
      setWaypoints(
        route.route_waypoints
          .filter(wp => wp.farm)
          .map(wp => ({
            id: wp.id,
            farmId: wp.farm!.id,
            farmName: wp.farm!.name,
            ruc: wp.farm!.ruc,
            zone: wp.zone || '',
            sapRouteId: wp.sap_route_id || '',
            plannedPickupAmount: wp.planned_pickup_amount || 0,
            latitude: wp.farm!.latitude,
            longitude: wp.farm!.longitude
          }))
      );
    }
  }, [isOpen, route]);

  // Helpers para buscar IDs por nombre/placa (ya que route trae el objeto, no el ID)
  const findDriverId = (firstName: string): string => {
    const driver = drivers.find(d => d.first_name === firstName);
    return driver?.id || '';
  };

  const findVehicleId = (plate: string): string => {
    const vehicle = vehicles.find(v => v.plate === plate);
    return vehicle?.id || '';
  };

  // Mutación para guardar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();

      // 1. Actualizar cabecera de ruta
      const { error: routeError } = await supabase
        .from('routes')
        .update({
          driver_id: driverId || null,
          vehicle_id: vehicleId || null,
          precintos_count: precintos,
          programed_start_time: startTime,
          programed_arrival_time: endTime
        } as any)
        .eq('id', route.id);

      if (routeError) throw new Error(`Error actualizando ruta: ${routeError.message}`);

      // 2. Eliminar waypoints existentes
      const { error: deleteError } = await supabase
        .from('route_waypoints')
        .delete()
        .eq('route_id', route.id);

      if (deleteError) throw new Error(`Error eliminando waypoints: ${deleteError.message}`);

      // 3. Insertar nuevos waypoints con orden actualizado
      if (waypoints.length > 0) {
        const waypointsPayload = waypoints.map((wp, idx) => ({
          route_id: route.id,
          farm_id: wp.farmId,
          stop_order: idx + 1,
          planned_pickup_amount: wp.plannedPickupAmount,
          zone: wp.zone,
          sap_route_id: wp.sapRouteId
        }));

        const { error: insertError } = await supabase
          .from('route_waypoints')
          .insert(waypointsPayload as any);

        if (insertError) throw new Error(`Error insertando waypoints: ${insertError.message}`);
      }

      console.log(`✅ Ruta ${route.id} actualizada: ${waypoints.length} waypoints`);
    },
    onSuccess: () => {
      toast.success('Ruta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['routeDetail', route.id] });
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      onClose();
    },
    onError: (err: Error) => {
      console.error('❌ Error al guardar:', err);
      toast.error(err.message);
    }
  });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Editar Ruta</h3>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        {isLoadingData ? (
          <div className={styles.modalBody}>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <div className={styles.modalBody}>
            <div className={styles.editLayout}>
              {/* Columna izquierda: Formulario */}
              <div className={styles.editFormColumn}>
                <EditRouteGeneralForm
                  driverId={driverId}
                  vehicleId={vehicleId}
                  precintos={precintos}
                  startTime={startTime}
                  endTime={endTime}
                  drivers={drivers}
                  vehicles={vehicles}
                  onDriverChange={setDriverId}
                  onVehicleChange={setVehicleId}
                  onPrecintosChange={setPrecintos}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                />

                <EditRouteWaypointList
                  waypoints={waypoints}
                  farms={farms}
                  onWaypointsChange={setWaypoints}
                />
              </div>

              {/* Columna derecha: Mapa */}
              <div className={styles.editMapColumn}>
                <EditRouteMapPreview waypoints={waypoints} />
              </div>
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            className={styles.saveButton}
            disabled={saveMutation.isPending || waypoints.length === 0}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};