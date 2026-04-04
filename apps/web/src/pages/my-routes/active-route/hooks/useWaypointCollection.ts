// File: apps/web/src/pages/my-routes/active-route/hooks/useWaypointCollection.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import type {
  WaypointCollection,
  WaypointCollectionInput,
  CollectionSummary,
} from '../types';

// Re-exportar para no romper imports existentes
export type { WaypointCollection, WaypointCollectionInput };

// Helper para evitar inferencia 'never' en tablas sin tipos generados
const db = () => getSupabase() as ReturnType<typeof getSupabase> & {
  from: (table: string) => any;
};

// Columnas que seleccionamos siempre
const COLLECTION_COLUMNS = 'id, waypoint_id, route_id, arrival_time, departure_time, precinto_ingreso, precinto_salida, guia_transportista_number, guia_remision_number, guia_transportista_file, guia_remision_file, saldo, observations, status';

// --- Hook principal ---

export const useWaypointCollection = (waypointId: string, routeId: string) => {
  const queryClient = useQueryClient();

  const collectionQuery = useQuery<WaypointCollection | null>({
    queryKey: ['waypointCollection', waypointId],
    queryFn: async () => {
      const { data, error } = await db()
        .from('waypoint_collections')
        .select(COLLECTION_COLUMNS)
        .eq('waypoint_id', waypointId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data as WaypointCollection) ?? null;
    },
    enabled: !!waypointId,
    staleTime: 1000 * 30, // 30s — evita refetch al cambiar de tab
  });

  const saveMutation = useMutation<WaypointCollection, Error, WaypointCollectionInput>({
    mutationFn: async (input) => {
      const existing = collectionQuery.data;

      if (existing) {
        const { data, error } = await db()
          .from('waypoint_collections')
          .update({
            precinto_ingreso: input.precinto_ingreso ?? existing.precinto_ingreso,
            precinto_salida: input.precinto_salida ?? existing.precinto_salida,
            guia_transportista_number: input.guia_transportista_number ?? existing.guia_transportista_number,
            guia_remision_number: input.guia_remision_number ?? existing.guia_remision_number,
            guia_transportista_file: input.guia_transportista_file ?? existing.guia_transportista_file,
            guia_remision_file: input.guia_remision_file ?? existing.guia_remision_file,
            saldo: input.saldo !== undefined ? input.saldo : existing.saldo,
            observations: input.observations ?? existing.observations,
            status: input.status ?? existing.status,
            arrival_time: input.arrival_time ?? existing.arrival_time,
            departure_time: input.departure_time ?? existing.departure_time,
          })
          .eq('id', existing.id)
          .select(COLLECTION_COLUMNS)
          .single();
        if (error) throw new Error(error.message);
        return data as WaypointCollection;
      } else {
        const { data, error } = await db()
          .from('waypoint_collections')
          .insert({
            waypoint_id: waypointId,
            route_id: routeId,
            status: input.status ?? 'in_progress',
            arrival_time: input.arrival_time ?? new Date().toISOString(),
            precinto_ingreso: input.precinto_ingreso ?? null,
            precinto_salida: input.precinto_salida ?? null,
            guia_transportista_number: input.guia_transportista_number ?? null,
            guia_remision_number: input.guia_remision_number ?? null,
            guia_transportista_file: input.guia_transportista_file ?? null,
            guia_remision_file: input.guia_remision_file ?? null,
            saldo: input.saldo ?? null,
            observations: input.observations ?? null,
          })
          .select(COLLECTION_COLUMNS)
          .single();
        if (error) throw new Error(error.message);
        return data as WaypointCollection;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypointCollection', waypointId] });
      queryClient.invalidateQueries({ queryKey: ['allCollections', routeId] });
    },
    onError: (e) => toast.error(`Error al guardar: ${e.message}`),
  });

  const completeMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const existing = collectionQuery.data;
      if (!existing) throw new Error('No hay datos para completar');

      const { error } = await db()
        .from('waypoint_collections')
        .update({
          status: 'completed',
          departure_time: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Parada completada');
      queryClient.invalidateQueries({ queryKey: ['waypointCollection', waypointId] });
      queryClient.invalidateQueries({ queryKey: ['allCollections', routeId] });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return {
    collection: collectionQuery.data ?? null,
    isLoading: collectionQuery.isLoading,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    complete: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
};

// --- Hook auxiliar: todas las colecciones de una ruta ---

export const useAllCollections = (routeId: string) => {
  return useQuery<CollectionSummary[]>({
    queryKey: ['allCollections', routeId],
    queryFn: async () => {
      const { data, error } = await db()
        .from('waypoint_collections')
        .select('id, waypoint_id, status')
        .eq('route_id', routeId);
      if (error) throw new Error(error.message);
      return (data ?? []) as CollectionSummary[];
    },
    enabled: !!routeId,
    staleTime: 1000 * 30,
  });
};