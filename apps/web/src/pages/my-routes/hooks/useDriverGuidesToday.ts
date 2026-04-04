// File: apps/web/src/pages/my-routes/hooks/useDriverGuidesToday.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useProfile } from '../../../hooks/useProfile';

// Helper para evitar inferencia 'never'
const db = () => getSupabase() as ReturnType<typeof getSupabase> & {
  from: (table: string) => any;
};

// Fecha de hoy
const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface DriverGuideEntry {
  id: string;
  waypoint_id: string;
  route_id: string;
  status: string;
  guia_transportista_number: string | null;
  guia_remision_number: string | null;
  guia_transportista_file: string | null;
  guia_remision_file: string | null;
  precinto_ingreso: string | null;
  precinto_salida: string | null;
  waypoint: {
    stop_order: number;
    farm: { name: string; ruc: string } | null;
  } | null;
}

export interface DriverGuideRoute {
  routeId: string;
  sapRouteId: string;
  plate: string;
  entries: DriverGuideEntry[];
}

export const useDriverGuidesToday = () => {
  const { data: profile } = useProfile();
  const today = getToday();

  return useQuery<DriverGuideRoute[]>({
    queryKey: ['driverGuidesToday', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) return [];

      // 1. Obtener rutas del conductor de hoy
      const { data: routes, error: routesError } = await db()
        .from('routes')
        .select('id, sap_route_id, vehicle:vehicles(plate)')
        .eq('driver_id', profile.id)
        .eq('route_date', today);

      if (routesError) throw new Error(routesError.message);
      if (!routes || routes.length === 0) return [];

      const typedRoutes = routes as { id: string; sap_route_id: string | null; vehicle: { plate: string } | null }[];
      const routeIds = typedRoutes.map((r) => r.id);

      // 2. Obtener colecciones de esas rutas
      const { data: collections, error: colError } = await db()
        .from('waypoint_collections')
        .select(`
          id, waypoint_id, route_id, status,
          guia_transportista_number, guia_remision_number,
          guia_transportista_file, guia_remision_file,
          precinto_ingreso, precinto_salida,
          waypoint:route_waypoints(
            stop_order,
            farm:farms(name, ruc)
          )
        `)
        .in('route_id', routeIds);

      if (colError) throw new Error(colError.message);

      const entries = (collections ?? []) as unknown as DriverGuideEntry[];

      // 3. Agrupar por ruta
      const groups: DriverGuideRoute[] = typedRoutes.map((route) => ({
        routeId: route.id,
        sapRouteId: route.sap_route_id || '—',
        plate: route.vehicle?.plate || '—',
        entries: entries
          .filter(e => e.route_id === route.id)
          .sort((a, b) => {
            const orderA = a.waypoint?.stop_order ?? 99;
            const orderB = b.waypoint?.stop_order ?? 99;
            return orderA - orderB;
          }),
      }));

      return groups.filter(g => g.entries.length > 0);
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60,
  });
};