// File: apps/web/src/pages/my-routes/active-route/hooks/useActiveRoute.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

// --- Tipos ---

export interface ActiveWaypointFarm {
  id: string;
  name: string;
  ruc: string;
  latitude: number;
  longitude: number;
}

export interface ActiveWaypoint {
  id: string;
  stop_order: number;
  planned_pickup_amount: number;
  zone: string;
  sap_route_id: string;
  farm: ActiveWaypointFarm | null;
}

export interface ActiveRouteDetail {
  id: string;
  route_date: string;
  status: string;
  sap_route_id: string | null;
  precintos_count: string;
  programed_start_time: string;
  programed_arrival_time: string;
  started_at: string | null;
  completed_at: string | null;
  driver: { first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: ActiveWaypoint[];
}

// --- Hook ---

export const useActiveRoute = (routeId: string) => {
  const queryClient = useQueryClient();

  // Fetch completo de la ruta con waypoints y granjas
  const routeQuery = useQuery({
    queryKey: ['activeRoute', routeId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, route_date, status, sap_route_id, precintos_count,
          programed_start_time, programed_arrival_time,
          started_at, completed_at,
          driver:profiles(first_name, paternal_last_name),
          vehicle:vehicles(plate),
          route_waypoints(
            id, stop_order, planned_pickup_amount, zone, sap_route_id,
            farm:farms(id, name, ruc, latitude, longitude)
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) throw new Error(error.message);

      // Ordenar waypoints
      if (data?.route_waypoints) {
        data.route_waypoints.sort((a: any, b: any) => a.stop_order - b.stop_order);
      }

      return data as unknown as ActiveRouteDetail;
    },
    enabled: !!routeId,
  });

  // Iniciar ruta
  const startMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('routes')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        } as any)
        .eq('id', routeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Ruta iniciada');
      queryClient.invalidateQueries({ queryKey: ['activeRoute', routeId] });
      queryClient.invalidateQueries({ queryKey: ['myRoutes'] });
    },
    onError: (e: Error) => toast.error(`Error al iniciar: ${e.message}`),
  });

  // Finalizar ruta
  const completeMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('routes')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', routeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Ruta finalizada');
      queryClient.invalidateQueries({ queryKey: ['activeRoute', routeId] });
      queryClient.invalidateQueries({ queryKey: ['myRoutes'] });
    },
    onError: (e: Error) => toast.error(`Error al finalizar: ${e.message}`),
  });

  return {
    route: routeQuery.data,
    isLoading: routeQuery.isLoading,
    error: routeQuery.error,
    startRoute: startMutation.mutate,
    isStarting: startMutation.isPending,
    completeRoute: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
};