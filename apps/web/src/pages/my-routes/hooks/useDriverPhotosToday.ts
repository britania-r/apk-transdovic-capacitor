// File: apps/web/src/pages/my-routes/hooks/useDriverPhotosToday.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useProfile } from '../../../hooks/useProfile';

// Helper para evitar inferencia 'never'
const db = () => getSupabase() as ReturnType<typeof getSupabase> & {
  from: (table: string) => any;
};

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface DriverPhotoEntry {
  id: string;
  tank_id: string;
  photo_file: string;
  collection_id: string;
  tank: { name: string } | null;
  farmName: string;
  stopOrder: number;
  routeSap: string;
}

export interface DriverPhotoGroup {
  routeId: string;
  sapRouteId: string;
  plate: string;
  stops: {
    waypointId: string;
    stopOrder: number;
    farmName: string;
    photos: DriverPhotoEntry[];
  }[];
}

export const useDriverPhotosToday = () => {
  const { data: profile } = useProfile();
  const today = getToday();

  return useQuery<DriverPhotoGroup[]>({
    queryKey: ['driverPhotosToday', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) return [];

      // 1. Rutas del conductor hoy
      const { data: routes, error: routesError } = await db()
        .from('routes')
        .select('id, sap_route_id, vehicle:vehicles(plate)')
        .eq('driver_id', profile.id)
        .eq('route_date', today);

      if (routesError) throw new Error(routesError.message);
      if (!routes || routes.length === 0) return [];

      const typedRoutes = routes as { id: string; sap_route_id: string | null; vehicle: { plate: string } | null }[];
      const routeIds = typedRoutes.map(r => r.id);

      // 2. Colecciones con waypoint info
      const { data: collections, error: colError } = await db()
        .from('waypoint_collections')
        .select(`
          id, route_id, waypoint_id,
          waypoint:route_waypoints(
            stop_order,
            farm:farms(name)
          )
        `)
        .in('route_id', routeIds);

      if (colError) throw new Error(colError.message);
      if (!collections || collections.length === 0) return [];

      const typedCols = collections as {
        id: string;
        route_id: string;
        waypoint_id: string;
        waypoint: { stop_order: number; farm: { name: string } | null } | null;
      }[];

      const colIds = typedCols.map(c => c.id);

      // 3. Tank readings con foto
      const { data: readings, error: readError } = await db()
        .from('tank_readings')
        .select('id, tank_id, photo_file, collection_id, tank:farm_tanks(name)')
        .in('collection_id', colIds)
        .not('photo_file', 'is', null);

      if (readError) throw new Error(readError.message);
      if (!readings || readings.length === 0) return [];

      const typedReadings = readings as {
        id: string;
        tank_id: string;
        photo_file: string;
        collection_id: string;
        tank: { name: string } | null;
      }[];

      // 4. Construir mapa de colección → info
      const colMap = new Map(typedCols.map(c => [c.id, c]));

      // 5. Agrupar por ruta → parada → fotos
      const groups: DriverPhotoGroup[] = typedRoutes.map(route => {
        const routeCols = typedCols.filter(c => c.route_id === route.id);

        const stopsMap = new Map<string, {
          waypointId: string;
          stopOrder: number;
          farmName: string;
          photos: DriverPhotoEntry[];
        }>();

        for (const col of routeCols) {
          const colReadings = typedReadings.filter(r => r.collection_id === col.id);
          if (colReadings.length === 0) continue;

          const farmName = col.waypoint?.farm?.name || 'Granja';
          const stopOrder = col.waypoint?.stop_order ?? 99;

          if (!stopsMap.has(col.waypoint_id)) {
            stopsMap.set(col.waypoint_id, {
              waypointId: col.waypoint_id,
              stopOrder,
              farmName,
              photos: [],
            });
          }

          const stop = stopsMap.get(col.waypoint_id)!;
          for (const reading of colReadings) {
            stop.photos.push({
              id: reading.id,
              tank_id: reading.tank_id,
              photo_file: reading.photo_file,
              collection_id: reading.collection_id,
              tank: reading.tank,
              farmName,
              stopOrder,
              routeSap: route.sap_route_id || '—',
            });
          }
        }

        const stops = Array.from(stopsMap.values()).sort((a, b) => a.stopOrder - b.stopOrder);

        return {
          routeId: route.id,
          sapRouteId: route.sap_route_id || '—',
          plate: route.vehicle?.plate || '—',
          stops,
        };
      });

      return groups.filter(g => g.stops.length > 0);
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60,
  });
};