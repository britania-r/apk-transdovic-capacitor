// File: apps/web/src/pages/dashboard/hooks/useLiveTrackingMulti.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface TrackingPoint {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

/**
 * Suscripción Realtime al GPS de múltiples rutas activas.
 * Mantiene el último punto por ruta y el trail completo de la ruta seleccionada.
 */
export const useLiveTrackingMulti = (routeIds: string[], selectedRouteId: string | null) => {
  // Último punto por ruta (para mostrar todos los conductores en el mapa)
  const [latestByRoute, setLatestByRoute] = useState<Map<string, TrackingPoint>>(new Map());
  // Trail completo de la ruta seleccionada
  const [selectedTrail, setSelectedTrail] = useState<TrackingPoint[]>([]);

  // Cargar último punto de cada ruta activa
  const latestQuery = useQuery({
    queryKey: ['latestTrackingPoints', routeIds],
    queryFn: async () => {
      if (routeIds.length === 0) return [];
      const supabase = getSupabase();

      // Para cada ruta, traer el último punto
      const promises = routeIds.map(async (routeId) => {
        const { data } = await supabase
          .from('route_trackings')
          .select('id, route_id, latitude, longitude, accuracy, speed, heading, recorded_at')
          .eq('route_id', routeId)
          .order('recorded_at', { ascending: false })
          .limit(1);
        return data?.[0] as TrackingPoint | undefined;
      });

      const results = await Promise.all(promises);
      return results.filter(Boolean) as TrackingPoint[];
    },
    enabled: routeIds.length > 0,
  });

  // Inicializar mapa de últimos puntos
  useEffect(() => {
    if (latestQuery.data) {
      const map = new Map<string, TrackingPoint>();
      for (const point of latestQuery.data) {
        map.set(point.route_id, point);
      }
      setLatestByRoute(map);
    }
  }, [latestQuery.data]);

  // Cargar trail completo de la ruta seleccionada
  const trailQuery = useQuery({
    queryKey: ['selectedRouteTrail', selectedRouteId],
    queryFn: async () => {
      if (!selectedRouteId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('route_trackings')
        .select('id, route_id, latitude, longitude, accuracy, speed, heading, recorded_at')
        .eq('route_id', selectedRouteId)
        .order('recorded_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as TrackingPoint[];
    },
    enabled: !!selectedRouteId,
  });

  useEffect(() => {
    setSelectedTrail(trailQuery.data || []);
  }, [trailQuery.data]);

  // Suscripción Realtime a inserts de todas las rutas activas
  useEffect(() => {
    if (routeIds.length === 0) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel('dashboard-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'route_trackings',
        },
        (payload) => {
          const newPoint = payload.new as TrackingPoint;

          // Solo procesar si es de una ruta que nos interesa
          if (!routeIds.includes(newPoint.route_id)) return;

          // Actualizar último punto de esa ruta
          setLatestByRoute(prev => {
            const next = new Map(prev);
            next.set(newPoint.route_id, newPoint);
            return next;
          });

          // Si es la ruta seleccionada, agregar al trail
          if (newPoint.route_id === selectedRouteId) {
            setSelectedTrail(prev => [...prev, newPoint]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [routeIds, selectedRouteId]);

  return {
    latestByRoute,
    selectedTrail,
    isLoading: latestQuery.isLoading,
  };
};