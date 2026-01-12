// File: apps/web/src/pages/routes-management/CreateRoutePage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { APIProvider } from '@vis.gl/react-google-maps';

import { RoutePlanner } from './RoutePlanner';
import { RouteMap } from './RouteMap';
import { WaypointDetailsModal } from './WaypointDetailsModal';
import { evaluateExcelFormula } from '../../utils/formula-parser';
import styles from './RoutesPage.module.css';

// ============================================================================
// 1. TIPOS Y FUNCIONES DE API
// ============================================================================

export interface Driver { id: string; first_name: string; paternal_last_name: string; }
export interface Vehicle { id: string; name: string; plate: string; }
export interface Farm { id: string; name: string; latitude: number; longitude: number; excel_formula: string | null; farm_tanks: { id: string; name: string }[]; }
export interface SelectOption { value: string; label: string; }
export interface GasStation { id: string; name: string; latitude: number; longitude: number; billing_frequency: number; notes: string | null; }

export interface TollAnalysis {
  gasStation: GasStation;
  passesOnOutbound: boolean;
  passesOnReturn: boolean;
  timesToCharge: number;
}

const fetchRouteCreationData = async () => {
  const supabase = getSupabase();
  const [driversRes, farmsRes, vehiclesRes, baseLocationRes, gasStationsRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name, paternal_last_name').in('role', ['Conductor carga pesada']),
    supabase.from('farms').select('*, farm_tanks(id, name)').eq('is_base_location', false).order('name'),
    supabase.from('vehicles').select('id, plate').order('plate'),
    supabase.from('farms').select('*, farm_tanks(id, name)').eq('is_base_location', true).single(),
    supabase.from('gas_stations').select('id, name, latitude, longitude, billing_frequency, notes'),
  ]);

  if (driversRes.error) throw new Error(`Conductores: ${driversRes.error.message}`);
  if (farmsRes.error) throw new Error(`Granjas: ${farmsRes.error.message}`);
  if (vehiclesRes.error) throw new Error(`Vehículos: ${vehiclesRes.error.message}`);
  if (baseLocationRes.error) throw new Error(`Base: ${baseLocationRes.error.message}`);
  if (gasStationsRes.error) throw new Error(`Peajes: ${gasStationsRes.error.message}`);
  
  return { 
    drivers: driversRes.data as Driver[], 
    farms: farmsRes.data as Farm[], 
    vehicles: vehiclesRes.data as Vehicle[],
    baseLocation: baseLocationRes.data as Farm,
    gasStations: gasStationsRes.data as GasStation[],
  };
};

const saveRoute = async (payload: {
  driverId: string;
  vehicleId: string;
  routeDate: string;
  waypoints: Farm[];
  baseLocation: Farm;
  distance: number;
  duration: number;
  tollCharges: number;
}) => {
  const supabase = getSupabase();
  
  const { data: routeData, error: routeError } = await supabase.from('routes').insert({
    driver_id: payload.driverId,
    vehicle_id: payload.vehicleId,
    route_date: payload.routeDate,
    distance_km: payload.distance,
    estimated_time_min: payload.duration,
    toll_charges: payload.tollCharges,
  }).select().single();

  if (routeError) throw routeError;
  if (!routeData) throw new Error('No se pudo crear la ruta principal.');

  const waypointsToInsert = [
    { route_id: routeData.id, farm_id: payload.baseLocation.id, stop_order: 1 },
    ...payload.waypoints.map((wp, index) => ({
      route_id: routeData.id,
      farm_id: wp.id,
      stop_order: index + 2,
    })),
    { route_id: routeData.id, farm_id: payload.baseLocation.id, stop_order: payload.waypoints.length + 2 }
  ];

  const { error: waypointError } = await supabase.from('route_waypoints').insert(waypointsToInsert);
  
  if (waypointError) {
    await supabase.from('routes').delete().eq('id', routeData.id);
    throw waypointError;
  }
};

// ============================================================================
// 2. COMPONENTE ORQUESTADOR
// ============================================================================

const CreateRoutePageContent = () => {
  const [selectedDriverId, setDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setVehicleId] = useState<string | null>(null);
  const [routeDate, setRouteDate] = useState('');
  const [waypoints, setWaypoints] = useState<Farm[]>([]);
  const [routeMetrics, setRouteMetrics] = useState({ distance: '', duration: '' });
  const [tollAnalysis, setTollAnalysis] = useState<TollAnalysis[]>([]);
  const [selectedWaypointForModal, setSelectedWaypointForModal] = useState<Farm | null>(null);
  
  // Estados para resetear los selects de React Select
  const [driverSelectKey, setDriverSelectKey] = useState(0);
  const [vehicleSelectKey, setVehicleSelectKey] = useState(0);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['routeCreationData'],
    queryFn: fetchRouteCreationData,
  });

  const saveMutation = useMutation({
    mutationFn: saveRoute,
    onSuccess: () => {
      toast.success('Ruta guardada y asignada exitosamente');
      setDriverId(null);
      setVehicleId(null);
      setRouteDate('');
      setWaypoints([]);
      setTollAnalysis([]);
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
    },
    onError: (e: Error) => toast.error(`Error al guardar: ${e.message}`),
  });
  
  const handleAddWaypoint = (farmId: string) => {
    if (waypoints.some(wp => wp.id === farmId)) return toast.error('Esta granja ya está en la ruta.');
    const farmToAdd = data?.farms?.find(f => f.id === farmId);
    if (farmToAdd) setWaypoints(prev => [...prev, farmToAdd]);
  };
  
  const handleRemoveWaypoint = (indexToRemove: number) => {
    setWaypoints(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWaypoints((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveRoute = () => {
    if (!selectedDriverId || !selectedVehicleId || !routeDate) {
      return toast.error('Por favor, selecciona conductor, vehículo y fecha.');
    }
    if (waypoints.length < 1) {
      return toast.error('La ruta debe tener al menos una parada intermedia.');
    }

    const distanceInKm = parseFloat(routeMetrics.distance.replace(/[^0-9.]/g, ''));
    const durationInMin = parseInt(routeMetrics.duration.replace(/[^0-9.]/g, ''));
    const totalTollCharges = tollAnalysis.reduce((sum, toll) => sum + toll.timesToCharge, 0);

    saveMutation.mutate({
      driverId: selectedDriverId,
      vehicleId: selectedVehicleId,
      routeDate,
      waypoints,
      baseLocation: data!.baseLocation,
      distance: isNaN(distanceInKm) ? 0 : distanceInKm,
      duration: isNaN(durationInMin) ? 0 : durationInMin,
      tollCharges: totalTollCharges,
    });
  };

  if (isLoading) return <p>Cargando datos para creación de ruta...</p>;
  if (error) return <p style={{ color: 'red' }}>Error al cargar datos: {(error as Error).message}</p>;
  if (!data?.baseLocation) return <p style={{ color: 'red' }}>Error: No se encontró la ubicación base "ORIGEN / DESTINO PRINCIPAL" en la base de datos.</p>;

  const { drivers, farms, vehicles, baseLocation, gasStations } = data;
  const driverOptions: SelectOption[] = drivers.map(d => ({ value: d.id, label: `${d.first_name} ${d.paternal_last_name}` }));
  const farmOptions: SelectOption[] = farms.filter(f => !waypoints.some(wp => wp.id === f.id)).map(f => ({ value: f.id, label: f.name }));
  const vehicleOptions: SelectOption[] = vehicles.map(v => ({ value: v.id, label: `${v.plate}` }));

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={styles.routesContainer}>
        <RoutePlanner
          driverOptions={driverOptions}
          vehicleOptions={vehicleOptions}
          farmOptions={farmOptions}
          waypoints={waypoints}
          onDriverChange={(option) => setDriverId(option?.value || null)}
          onVehicleChange={(option) => setVehicleId(option?.value || null)}
          onDateChange={(date) => setRouteDate(date)}
          onAddWaypoint={(option) => handleAddWaypoint(option?.value || '')}
          onRemoveWaypoint={handleRemoveWaypoint}
          onSave={handleSaveRoute}
          routeMetrics={routeMetrics}
          tollAnalysis={tollAnalysis}
          isSaving={saveMutation.isPending}
        />
        <div className={styles.mapContainer}>
          <RouteMap
            baseLocation={baseLocation}
            waypoints={waypoints}
            gasStations={gasStations}
            onRouteCalculated={setRouteMetrics}
            onTollAnalysisUpdate={setTollAnalysis}
            onMarkerClick={setSelectedWaypointForModal}
          />
        </div>

        {selectedWaypointForModal && (
          <WaypointDetailsModal
            waypoint={selectedWaypointForModal}
            onClose={() => setSelectedWaypointForModal(null)}
            evaluateFormula={evaluateExcelFormula}
          />
        )}
      </div>
    </DndContext>
  );
};

export const CreateRoutePage = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <CreateRoutePageContent />
  </APIProvider>
);