// File: apps/web/src/pages/my-routes/active-route/hooks/useActiveRoute.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import type { ActiveRouteDetail, ActiveWaypoint } from '../types';

// Re-exportar para no romper imports existentes
export type { ActiveRouteDetail, ActiveWaypoint };
export type { Farm as ActiveWaypointFarm } from '../types';

// Helper para evitar inferencia 'never'
const db = () => getSupabase() as ReturnType<typeof getSupabase> & {
  from: (table: string) => any;
};

// --- Hook ---

export const useActiveRoute = (routeId: string) => {
  const queryClient = useQueryClient();

  const routeQuery = useQuery<ActiveRouteDetail>({
    queryKey: ['activeRoute', routeId],
    queryFn: async () => {
      const { data, error } = await db()
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

      const route = data as ActiveRouteDetail;

      // Ordenar waypoints
      if (route?.route_waypoints) {
        route.route_waypoints.sort((a, b) => a.stop_order - b.stop_order);
      }

      return route;
    },
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2, // 2 min cache — reduce refetches al navegar entre paradas
  });

  // Iniciar ruta
  const startMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await db()
        .from('routes')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', routeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Ruta iniciada');
      queryClient.invalidateQueries({ queryKey: ['activeRoute', routeId] });
      queryClient.invalidateQueries({ queryKey: ['myRoutes'] });
    },
    onError: (e) => toast.error(`Error al iniciar: ${e.message}`),
  });

  // Finalizar ruta
  const completeMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await db()
        .from('routes')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', routeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Ruta finalizada');
      queryClient.invalidateQueries({ queryKey: ['activeRoute', routeId] });
      queryClient.invalidateQueries({ queryKey: ['myRoutes'] });
    },
    onError: (e) => toast.error(`Error al finalizar: ${e.message}`),
  });

  return {
    route: routeQuery.data ?? null,
    isLoading: routeQuery.isLoading,
    error: routeQuery.error,
    startRoute: startMutation.mutate,
    isStarting: startMutation.isPending,
    completeRoute: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
};