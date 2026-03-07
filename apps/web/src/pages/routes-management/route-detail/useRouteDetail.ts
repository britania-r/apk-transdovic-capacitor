// File: apps/web/src/pages/routes-management/route-detail/useRouteDetail.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export const PLANT_LOCATION = {
  lat: -8.135258486791704,
  lng: -79.01138128594722,
  name: 'Planta Transdovic'
};

export interface WaypointDetail {
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
}

export interface RouteDetail {
  id: string;
  route_date: string;
  status: string;
  precintos_count: string;
  programed_start_time: string;
  programed_arrival_time: string;
  driver: { first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: WaypointDetail[];
}

export interface TollStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  billing_frequency: number; // 1 = solo ida, 2 = ida y vuelta
}

export const useRouteDetail = (routeId: string) => {
  const routeQuery = useQuery({
    queryKey: ['routeDetail', routeId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, route_date, status, precintos_count,
          programed_start_time, programed_arrival_time,
          driver:profiles(first_name, paternal_last_name),
          vehicle:vehicles(plate),
          route_waypoints(
            id, stop_order, planned_pickup_amount, zone, sap_route_id,
            farm:farms(id, name, ruc, latitude, longitude)
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) throw error;

      // Ordenar waypoints por stop_order
      if (data?.route_waypoints) {
        data.route_waypoints.sort((a: any, b: any) => a.stop_order - b.stop_order);
      }

      return data as unknown as RouteDetail;
    },
    enabled: !!routeId
  });

  const tollsQuery = useQuery({
    queryKey: ['tollStations'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('gas_stations')
        .select('id, name, latitude, longitude, billing_frequency');

      if (error) throw error;
      return data as TollStation[];
    }
  });

  return {
    route: routeQuery.data,
    tolls: tollsQuery.data || [],
    isLoading: routeQuery.isLoading || tollsQuery.isLoading,
    error: routeQuery.error || tollsQuery.error
  };
};