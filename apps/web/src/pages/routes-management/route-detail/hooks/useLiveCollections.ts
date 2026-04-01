// File: apps/web/src/pages/routes-management/route-detail/hooks/useLiveCollections.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface LiveCollection {
  id: string;
  waypoint_id: string;
  status: string;
  arrival_time: string | null;
  departure_time: string | null;
  precinto_ingreso: string | null;
  precinto_salida: string | null;
  guia_transportista_number: string | null;
  guia_remision_number: string | null;
  guia_transportista_file: string | null;
  guia_remision_file: string | null;
  saldo: number | null;
  observations: string | null;
}

export interface LiveTankReading {
  id: string;
  collection_id: string;
  tank_id: string;
  reading_cm: number | null;
  reading_mm: number | null;
  table_liters: number | null;
  manual_liters: number | null;
  factor: number;
  kg: number | null;
  kg_direct: number | null;
  temperature: number | null;
  lab_authorized: boolean | null;
  observation: string | null;
  tank: { name: string } | null;
}

/**
 * Hook que trae colecciones y lecturas de tanque de una ruta,
 * y se suscribe a cambios en tiempo real.
 */
export const useLiveCollections = (routeId: string, isActive: boolean) => {
  const [collections, setCollections] = useState<LiveCollection[]>([]);
  const [tankReadings, setTankReadings] = useState<LiveTankReading[]>([]);

  // Cargar colecciones existentes
  const collectionsQuery = useQuery({
    queryKey: ['liveCollections', routeId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('waypoint_collections')
        .select('*')
        .eq('route_id', routeId);
      if (error) throw new Error(error.message);
      return (data || []) as LiveCollection[];
    },
    enabled: !!routeId,
  });

  // Cargar lecturas de tanques
  const readingsQuery = useQuery({
    queryKey: ['liveTankReadings', routeId],
    queryFn: async () => {
      const supabase = getSupabase();

      // Primero obtener IDs de colecciones de esta ruta
      const { data: cols } = await supabase
        .from('waypoint_collections')
        .select('id')
        .eq('route_id', routeId);

      if (!cols || cols.length === 0) return [];

      const collectionIds = cols.map(c => c.id);

      const { data, error } = await supabase
        .from('tank_readings')
        .select('*, tank:farm_tanks(name)')
        .in('collection_id', collectionIds);

      if (error) throw new Error(error.message);
      return (data || []) as LiveTankReading[];
    },
    enabled: !!routeId,
  });

  // Inicializar desde queries
  useEffect(() => {
    if (collectionsQuery.data) setCollections(collectionsQuery.data);
  }, [collectionsQuery.data]);

  useEffect(() => {
    if (readingsQuery.data) setTankReadings(readingsQuery.data);
  }, [readingsQuery.data]);

  // Suscripción Realtime a waypoint_collections
  useEffect(() => {
    if (!isActive || !routeId) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel(`route-collections-${routeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waypoint_collections',
          filter: `route_id=eq.${routeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCollections(prev => [...prev, payload.new as LiveCollection]);
          } else if (payload.eventType === 'UPDATE') {
            setCollections(prev =>
              prev.map(c => c.id === (payload.new as any).id ? payload.new as LiveCollection : c)
            );
          }
          // Refetch readings cuando cambian colecciones
          readingsQuery.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tank_readings',
        },
        () => {
          // Refetch readings en cualquier cambio
          readingsQuery.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [routeId, isActive]);

  // Helper: obtener colección de un waypoint
  const getCollectionForWaypoint = (waypointId: string): LiveCollection | undefined => {
    return collections.find(c => c.waypoint_id === waypointId);
  };

  // Helper: obtener lecturas de una colección
  const getReadingsForCollection = (collectionId: string): LiveTankReading[] => {
    return tankReadings.filter(r => r.collection_id === collectionId);
  };

  return {
    collections,
    tankReadings,
    isLoading: collectionsQuery.isLoading,
    getCollectionForWaypoint,
    getReadingsForCollection,
  };
};