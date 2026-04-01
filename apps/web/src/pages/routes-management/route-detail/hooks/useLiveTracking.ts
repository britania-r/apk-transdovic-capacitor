// File: apps/web/src/pages/routes-management/route-detail/hooks/useLiveTracking.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface TrackingPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

/**
 * Hook que se suscribe via Realtime a la ubicación del conductor.
 * Trae el historial inicial y luego escucha inserts nuevos.
 */
export const useLiveTracking = (routeId: string, isActive: boolean) => {
  const [latestPoint, setLatestPoint] = useState<TrackingPoint | null>(null);
  const [trailPoints, setTrailPoints] = useState<TrackingPoint[]>([]);

  // Cargar historial inicial de puntos GPS
  const historyQuery = useQuery({
    queryKey: ['routeTrackingHistory', routeId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('route_trackings')
        .select('id, latitude, longitude, accuracy, speed, heading, recorded_at')
        .eq('route_id', routeId)
        .order('recorded_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as TrackingPoint[];
    },
    enabled: !!routeId,
  });

  // Inicializar trail y latest desde historial
  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setTrailPoints(historyQuery.data);
      setLatestPoint(historyQuery.data[historyQuery.data.length - 1]);
    }
  }, [historyQuery.data]);

  // Suscripción Realtime solo cuando la ruta está activa
  useEffect(() => {
    if (!isActive || !routeId) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel(`route-tracking-${routeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'route_trackings',
          filter: `route_id=eq.${routeId}`,
        },
        (payload) => {
          const newPoint = payload.new as TrackingPoint;
          setLatestPoint(newPoint);
          setTrailPoints(prev => [...prev, newPoint]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [routeId, isActive]);

  return {
    latestPoint,
    trailPoints,
    isLoading: historyQuery.isLoading,
  };
};