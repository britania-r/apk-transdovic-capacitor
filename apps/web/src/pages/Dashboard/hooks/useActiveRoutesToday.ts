// File: apps/web/src/pages/dashboard/hooks/useActiveRoutesToday.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface ActiveRouteToday {
  id: string;
  route_date: string;
  status: string;
  sap_route_id: string | null;
  precintos_count: string;
  programed_start_time: string;
  programed_arrival_time: string;
  started_at: string | null;
  driver: { id: string; first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: {
    id: string;
    stop_order: number;
    planned_pickup_amount: number;
    zone: string;
    sap_route_id: string;
    farm: {
      id: string;
      name: string;
      ruc: string;
      latitude: number;
      longitude: number;
    } | null;
  }[];
}

// Fecha de hoy en zona horaria de Perú (UTC-5)
const getTodayPeru = () => {
  const now = new Date();
  const peruOffset = -5 * 60;
  const localOffset = now.getTimezoneOffset();
  const peruTime = new Date(now.getTime() + (localOffset + peruOffset) * 60000);
  return peruTime.toISOString().split('T')[0];
};

/**
 * Trae todas las rutas in_progress del día actual.
 * Refresca cada 30 segundos para detectar nuevas rutas iniciadas.
 */
export const useActiveRoutesToday = () => {
  const today = getTodayPeru();

  return useQuery({
    queryKey: ['activeRoutesToday', today],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, route_date, status, sap_route_id, precintos_count,
          programed_start_time, programed_arrival_time, started_at,
          driver:profiles(id, first_name, paternal_last_name),
          vehicle:vehicles(plate),
          route_waypoints(
            id, stop_order, planned_pickup_amount, zone, sap_route_id,
            farm:farms(id, name, ruc, latitude, longitude)
          )
        `)
        .eq('route_date', today)
        .eq('status', 'in_progress')
        .order('programed_start_time', { ascending: true });

      if (error) throw new Error(error.message);

      // Ordenar waypoints de cada ruta
      const routes = (data || []) as unknown as ActiveRouteToday[];
      for (const route of routes) {
        if (route.route_waypoints) {
          route.route_waypoints.sort((a, b) => a.stop_order - b.stop_order);
        }
      }

      return routes;
    },
    refetchInterval: 30_000, // Refetch cada 30s
  });
};