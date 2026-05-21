// File: apps/web/src/pages/routes-management/route-detail/EditRouteModal.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { useEditRouteData } from './useEditRouteData';
import { EditRouteGeneralForm } from './EditRouteGeneralForm';
import { EditRouteWaypointList } from './EditRouteWaypointList';
import type { RouteDetail } from './useRouteDetail';
import type { EditableWaypoint } from './EditRouteWaypointItem';
import formStyles from '../../../components/ui/FormModal.module.css';
import styles from './EditRouteModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  route: RouteDetail;
}

export const EditRouteModal = ({ isOpen, onClose, route }: Props) => {
  const { vehicles, drivers, farms, isLoading: isLoadingData } = useEditRouteData();
  const queryClient = useQueryClient();

  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [precintos, setPrecintos] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [waypoints, setWaypoints] = useState<EditableWaypoint[]>([]);

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

  const findDriverId = (firstName: string): string => {
    const driver = drivers.find(d => d.first_name === firstName);
    return driver?.id || '';
  };

  const findVehicleId = (plate: string): string => {
    const vehicle = vehicles.find(v => v.plate === plate);
    return vehicle?.id || '';
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();

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

      const { error: deleteError } = await supabase
        .from('route_waypoints')
        .delete()
        .eq('route_id', route.id);

      if (deleteError) throw new Error(`Error eliminando waypoints: ${deleteError.message}`);

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
    },
    onSuccess: () => {
      toast.success('Ruta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['routeDetail', route.id] });
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleClose = () => {
    if (saveMutation.isPending) return;
    onClose();
  };

  if (!isOpen) return null;

  const busy = saveMutation.isPending;

  return (
    <div className={formStyles.overlay}>
      <div className={`${formStyles.modal} ${styles.wideModal}`}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-edit-alt"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Editar Ruta</h3>
              <p className={formStyles.modalSubtitle}>
                Modifica los datos generales y las paradas de la ruta
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={formStyles.closeBtn} type="button" disabled={busy}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {isLoadingData ? (
            <div className={styles.loadingState}>
              <i className="bx bx-loader-alt bx-spin"></i>
              <span>Cargando datos...</span>
            </div>
          ) : (
            <div className={styles.editLayout}>
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
          )}
        </div>

        {/* Footer */}
        <div className={formStyles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={formStyles.cancelBtn}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className={formStyles.submitBtn}
            disabled={busy || waypoints.length === 0}
          >
            {busy ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
            ) : (
              <><i className="bx bx-save"></i> Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};