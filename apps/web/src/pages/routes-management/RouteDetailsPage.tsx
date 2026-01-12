// File: apps/web/src/pages/routes-management/RouteDetailsPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { APIProvider } from '@vis.gl/react-google-maps';
import { RouteMap } from './RouteMap';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import styles from './RouteDetailsPage.module.css';

interface Waypoint {
  stop_order: number;
  farm: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface RouteDetails {
  id: string;
  route_date: string;
  status: string;
  distance_km: number | null;
  estimated_time_min: number | null;
  toll_charges: number | null;
  driver_id: string;
  vehicle_id: string;
  driver: {
    id: string;
    first_name: string;
    paternal_last_name: string;
  };
  vehicle: {
    id: string;
    plate: string;
  };
  route_waypoints: Waypoint[];
}

interface Driver {
  id: string;
  first_name: string;
  paternal_last_name: string;
}

interface Vehicle {
  id: string;
  plate: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const fetchRouteDetails = async (routeId: string | undefined): Promise<RouteDetails | null> => {
  if (!routeId) return null;
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *, 
      driver: profiles!driver_id (id, first_name, paternal_last_name), 
      vehicle: vehicles!vehicle_id (id, plate),
      route_waypoints (stop_order, farm: farms (id, name, latitude, longitude))
    `)
    .eq('id', routeId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) return null;

  data.route_waypoints.sort((a, b) => a.stop_order - b.stop_order);
  
  return data;
};

const fetchDriversAndVehicles = async () => {
  const supabase = getSupabase();
  const [driversRes, vehiclesRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name, paternal_last_name').in('role', ['Conductor carga pesada']),
    supabase.from('vehicles').select('id, plate').order('plate'),
  ]);

  if (driversRes.error) throw new Error(driversRes.error.message);
  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);

  return {
    drivers: driversRes.data as Driver[],
    vehicles: vehiclesRes.data as Vehicle[],
  };
};

const updateRoute = async (payload: {
  routeId: string;
  driverId: string;
  vehicleId: string;
  routeDate: string;
  status: string;
}) => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('routes')
    .update({
      driver_id: payload.driverId,
      vehicle_id: payload.vehicleId,
      route_date: payload.routeDate,
      status: payload.status,
    })
    .eq('id', payload.routeId);

  if (error) throw error;
};

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

// --- COMPONENTE PRINCIPAL ---
const RouteDetailsContent = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: route, isLoading, error } = useQuery<RouteDetails | null, Error>({
    queryKey: ['routeDetails', routeId],
    queryFn: () => fetchRouteDetails(routeId),
  });

  const { data: selectData } = useQuery({
    queryKey: ['driversAndVehicles'],
    queryFn: fetchDriversAndVehicles,
  });

  const [formData, setFormData] = useState<{
    driverId: string;
    vehicleId: string;
    routeDate: string;
    status: string;
  }>({
    driverId: route?.driver_id || '',
    vehicleId: route?.vehicle_id || '',
    routeDate: route?.route_date || '',
    status: route?.status || 'pending',
  });

  // Actualizar formData cuando se cargue la ruta
  useState(() => {
    if (route) {
      setFormData({
        driverId: route.driver_id,
        vehicleId: route.vehicle_id,
        routeDate: route.route_date,
        status: route.status,
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateRoute,
    onSuccess: () => {
      toast.success('Ruta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['routeDetails', routeId] });
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      setIsEditing(false);
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleSave = () => {
    if (!routeId) return;
    updateMutation.mutate({
      routeId,
      driverId: formData.driverId,
      vehicleId: formData.vehicleId,
      routeDate: formData.routeDate,
      status: formData.status,
    });
  };

  const handleCancel = () => {
    if (route) {
      setFormData({
        driverId: route.driver_id,
        vehicleId: route.vehicle_id,
        routeDate: route.route_date,
        status: route.status,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) return <p>Cargando detalles de la ruta...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;
  if (!route) return <p>Ruta no encontrada.</p>;

  const waypointsForMap = route.route_waypoints.slice(1, -1).map(wp => wp.farm);
  const baseLocation = route.route_waypoints[0]?.farm;

  const driverOptions: SelectOption[] = selectData?.drivers.map(d => ({
    value: d.id,
    label: `${d.first_name} ${d.paternal_last_name}`
  })) || [];

  const vehicleOptions: SelectOption[] = selectData?.vehicles.map(v => ({
    value: v.id,
    label: v.plate
  })) || [];

  const selectedDriver = driverOptions.find(opt => opt.value === formData.driverId);
  const selectedVehicle = vehicleOptions.find(opt => opt.value === formData.vehicleId);
  const selectedStatus = statusOptions.find(opt => opt.value === formData.status);

  return (
    <div className={styles.pageContainer}>
      <Link to="/routes/list" className={styles.backLink}>
        <i className='bx bx-arrow-back'></i> Volver a la lista
      </Link>

      <div className={styles.contentWrapper}>
        {/* Formulario a la izquierda */}
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2>Detalles de la Ruta</h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                <i className='bx bx-edit'></i> Editar
              </button>
            ) : (
              <div className={styles.editActions}>
                <button onClick={handleSave} className={styles.saveButton} disabled={updateMutation.isPending}>
                  <i className='bx bx-check'></i> {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={handleCancel} className={styles.cancelButton} disabled={updateMutation.isPending}>
                  <i className='bx bx-x'></i> Cancelar
                </button>
              </div>
            )}
          </div>

          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label>Fecha de la Ruta</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.routeDate}
                  onChange={(e) => setFormData({ ...formData, routeDate: e.target.value })}
                  className={styles.input}
                />
              ) : (
                <p className={styles.value}>{format(parseISO(route.route_date), "dd 'de' MMMM, yyyy", { locale: es })}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Conductor Asignado</label>
              {isEditing ? (
                <Select
                  options={driverOptions}
                  value={selectedDriver}
                  onChange={(opt) => setFormData({ ...formData, driverId: opt?.value || '' })}
                  placeholder="Selecciona un conductor"
                />
              ) : (
                <p className={styles.value}>{route.driver ? `${route.driver.first_name} ${route.driver.paternal_last_name}` : '-'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Vehículo Asignado</label>
              {isEditing ? (
                <Select
                  options={vehicleOptions}
                  value={selectedVehicle}
                  onChange={(opt) => setFormData({ ...formData, vehicleId: opt?.value || '' })}
                  placeholder="Selecciona un vehículo"
                />
              ) : (
                <p className={styles.value}>{route.vehicle ? route.vehicle.plate : '-'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Estado</label>
              {isEditing ? (
                <Select
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={(opt) => setFormData({ ...formData, status: opt?.value || 'pending' })}
                  placeholder="Selecciona un estado"
                />
              ) : (
                <p className={styles.value}>{statusOptions.find(s => s.value === route.status)?.label || route.status}</p>
              )}
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <i className='bx bx-trip'></i>
                <div>
                  <span className={styles.metricLabel}>Distancia</span>
                  <span className={styles.metricValue}>{route.distance_km ? `${route.distance_km} km` : '-'}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <i className='bx bx-time'></i>
                <div>
                  <span className={styles.metricLabel}>Tiempo Estimado</span>
                  <span className={styles.metricValue}>{route.estimated_time_min ? `${route.estimated_time_min} min` : '-'}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <i className='bx bx-map-pin'></i>
                <div>
                  <span className={styles.metricLabel}>N° de Peajes</span>
                  <span className={styles.metricValue}>{route.toll_charges !== null ? route.toll_charges : '-'}</span>
                </div>
              </div>
            </div>

            <div className={styles.waypointsSection}>
              <h3>Paradas ({route.route_waypoints.length})</h3>
              <ol className={styles.waypointsList}>
                {route.route_waypoints.map((wp) => (
                  <li key={wp.stop_order}>
                    <span className={styles.stopNumber}>{wp.stop_order}</span>
                    <span className={styles.farmName}>{wp.farm.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Mapa a la derecha */}
        <div className={styles.mapPanel}>
          {baseLocation && (
            <RouteMap
              baseLocation={baseLocation}
              waypoints={waypointsForMap}
              gasStations={[]}
              onRouteCalculated={() => {}}
              onTollAnalysisUpdate={() => {}}
              onMarkerClick={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const RouteDetailsPage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <RouteDetailsContent />
  </APIProvider>
);