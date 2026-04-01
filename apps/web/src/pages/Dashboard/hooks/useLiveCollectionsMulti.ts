// File: apps/web/src/pages/dashboard/hooks/useLiveCollectionsMulti.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface LiveCollection {
  id: string;
  waypoint_id: string;
  route_id: string;
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
 * Trae colecciones y lecturas de todas las rutas activas.
 * Suscripción Realtime para actualizaciones en vivo.
 */
export const useLiveCollectionsMulti = (routeIds: string[]) => {
  const [collections, setCollections] = useState<LiveCollection[]>([]);
  const [tankReadings, setTankReadings] = useState<LiveTankReading[]>([]);

  // Cargar colecciones de todas las rutas
  const collectionsQuery = useQuery({
    queryKey: ['dashboardCollections', routeIds],
    queryFn: async () => {
      if (routeIds.length === 0) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('waypoint_collections')
        .select('*')
        .in('route_id', routeIds);
      if (error) throw new Error(error.message);
      return (data || []) as LiveCollection[];
    },
    enabled: routeIds.length > 0,
  });

  // Cargar lecturas de tanques
  const readingsQuery = useQuery({
    queryKey: ['dashboardTankReadings', routeIds],
    queryFn: async () => {
      if (routeIds.length === 0) return [];
      const supabase = getSupabase();

      const { data: cols } = await supabase
        .from('waypoint_collections')
        .select('id')
        .in('route_id', routeIds);

      if (!cols || cols.length === 0) return [];

      const { data, error } = await supabase
        .from('tank_readings')
        .select('*, tank:farm_tanks(name)')
        .in('collection_id', cols.map(c => c.id));

      if (error) throw new Error(error.message);
      return (data || []) as LiveTankReading[];
    },
    enabled: routeIds.length > 0,
  });

  useEffect(() => {
    if (collectionsQuery.data) setCollections(collectionsQuery.data);
  }, [collectionsQuery.data]);

  useEffect(() => {
    if (readingsQuery.data) setTankReadings(readingsQuery.data);
  }, [readingsQuery.data]);

  // Suscripción Realtime
  useEffect(() => {
    if (routeIds.length === 0) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel('dashboard-collections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waypoint_collections',
        },
        (payload) => {
          const record = payload.new as LiveCollection;
          if (!routeIds.includes(record.route_id)) return;

          if (payload.eventType === 'INSERT') {
            setCollections(prev => [...prev, record]);
          } else if (payload.eventType === 'UPDATE') {
            setCollections(prev => prev.map(c => c.id === record.id ? record : c));
          }
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
          readingsQuery.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [routeIds]);

  // Helpers
  const getCollectionsForRoute = (routeId: string) =>
    collections.filter(c => c.route_id === routeId);

  const getCollectionForWaypoint = (waypointId: string) =>
    collections.find(c => c.waypoint_id === waypointId);

  const getReadingsForCollection = (collectionId: string) =>
    tankReadings.filter(r => r.collection_id === collectionId);

  const getCompletedCount = (routeId: string) =>
    collections.filter(c => c.route_id === routeId && c.status === 'completed').length;

  return {
    collections,
    tankReadings,
    isLoading: collectionsQuery.isLoading,
    getCollectionsForRoute,
    getCollectionForWaypoint,
    getReadingsForCollection,
    getCompletedCount,
  };
};