// File: apps/web/src/pages/photos/hooks/useRoutePhotos.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

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

export interface PhotoEntry {
  id: string;
  tank_id: string;
  photo_file: string;
  collection_id: string;
  tankName: string;
}

export interface PhotoStop {
  waypointId: string;
  stopOrder: number;
  farmName: string;
  farmRuc: string;
  photos: PhotoEntry[];
}

export interface PhotoRoute {
  routeId: string;
  sapRouteId: string;
  driverName: string;
  plate: string;
  routeDate: string;
  stops: PhotoStop[];
  totalPhotos: number;
}

export const useRoutePhotos = (dateFilter?: string) => {
  const date = dateFilter || getToday();

  return useQuery<PhotoRoute[]>({
    queryKey: ['routePhotos', date],
    queryFn: async () => {
      // 1. Rutas de la fecha
      const { data: routes, error: routesError } = await db()
        .from('routes')
        .select(`
          id, sap_route_id, route_date,
          driver:profiles(first_name, paternal_last_name),
          vehicle:vehicles(plate)
        `)
        .eq('route_date', date);

      if (routesError) throw new Error(routesError.message);
      if (!routes || routes.length === 0) return [];

      const typedRoutes = routes as {
        id: string;
        sap_route_id: string | null;
        route_date: string;
        driver: { first_name: string; paternal_last_name: string } | null;
        vehicle: { plate: string } | null;
      }[];

      const routeIds = typedRoutes.map(r => r.id);

      // 2. Colecciones
      const { data: collections, error: colError } = await db()
        .from('waypoint_collections')
        .select(`
          id, route_id, waypoint_id,
          waypoint:route_waypoints(
            stop_order,
            farm:farms(name, ruc)
          )
        `)
        .in('route_id', routeIds);

      if (colError) throw new Error(colError.message);
      if (!collections || collections.length === 0) return [];

      const typedCols = collections as {
        id: string;
        route_id: string;
        waypoint_id: string;
        waypoint: { stop_order: number; farm: { name: string; ruc: string } | null } | null;
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

      // 4. Construir estructura agrupada: ruta → parada → fotos
      const result: PhotoRoute[] = typedRoutes.map(route => {
        const routeCols = typedCols.filter(c => c.route_id === route.id);

        const stopsMap = new Map<string, PhotoStop>();

        for (const col of routeCols) {
          const colReadings = typedReadings.filter(r => r.collection_id === col.id);
          if (colReadings.length === 0) continue;

          const farmName = col.waypoint?.farm?.name || 'Granja';
          const farmRuc = col.waypoint?.farm?.ruc || '—';
          const stopOrder = col.waypoint?.stop_order ?? 99;

          if (!stopsMap.has(col.waypoint_id)) {
            stopsMap.set(col.waypoint_id, {
              waypointId: col.waypoint_id,
              stopOrder,
              farmName,
              farmRuc,
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
              tankName: reading.tank?.name || 'Tanque',
            });
          }
        }

        const stops = Array.from(stopsMap.values()).sort((a, b) => a.stopOrder - b.stopOrder);
        const totalPhotos = stops.reduce((sum, s) => sum + s.photos.length, 0);

        const driverName = route.driver
          ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
          : 'Sin conductor';

        return {
          routeId: route.id,
          sapRouteId: route.sap_route_id || '—',
          driverName,
          plate: route.vehicle?.plate || '—',
          routeDate: route.route_date,
          stops,
          totalPhotos,
        };
      });

      return result.filter(r => r.totalPhotos > 0);
    },
    staleTime: 1000 * 30,
  });
};