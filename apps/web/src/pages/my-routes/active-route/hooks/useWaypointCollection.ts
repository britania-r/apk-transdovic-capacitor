// File: apps/web/src/pages/my-routes/active-route/hooks/useWaypointCollection.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

// --- Tipos ---

export interface WaypointCollection {
  id: string;
  waypoint_id: string;
  route_id: string;
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
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface WaypointCollectionInput {
  precinto_ingreso?: string;
  precinto_salida?: string;
  guia_transportista_number?: string;
  guia_remision_number?: string;
  guia_transportista_file?: string;
  guia_remision_file?: string;
  saldo?: number | null;
  observations?: string;
  status?: string;
  arrival_time?: string;
  departure_time?: string;
}

// --- Hook ---

export const useWaypointCollection = (waypointId: string, routeId: string) => {
  const queryClient = useQueryClient();

  // Fetch colección existente para este waypoint
  const collectionQuery = useQuery({
    queryKey: ['waypointCollection', waypointId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('waypoint_collections')
        .select('*')
        .eq('waypoint_id', waypointId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as WaypointCollection | null;
    },
    enabled: !!waypointId,
  });

  // Crear o actualizar colección
  const saveMutation = useMutation({
    mutationFn: async (input: WaypointCollectionInput) => {
      const supabase = getSupabase();
      const existing = collectionQuery.data;

      if (existing) {
        // Actualizar
        const { data, error } = await supabase
          .from('waypoint_collections')
          .update(input as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        // Crear
        const { data, error } = await supabase
          .from('waypoint_collections')
          .insert({
            waypoint_id: waypointId,
            route_id: routeId,
            status: 'in_progress',
            arrival_time: new Date().toISOString(),
            ...input,
          } as any)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypointCollection', waypointId] });
      queryClient.invalidateQueries({ queryKey: ['allCollections', routeId] });
    },
    onError: (e: Error) => toast.error(`Error al guardar: ${e.message}`),
  });

  // Marcar como completado
  const completeMutation = useMutation({
    mutationFn: async () => {
      const existing = collectionQuery.data;
      if (!existing) throw new Error('No hay datos para completar');

      const supabase = getSupabase();
      const { error } = await supabase
        .from('waypoint_collections')
        .update({
          status: 'completed',
          departure_time: new Date().toISOString(),
        } as any)
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Parada completada');
      queryClient.invalidateQueries({ queryKey: ['waypointCollection', waypointId] });
      queryClient.invalidateQueries({ queryKey: ['allCollections', routeId] });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return {
    collection: collectionQuery.data,
    isLoading: collectionQuery.isLoading,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    complete: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
};

// --- Hook auxiliar: todas las colecciones de una ruta ---

export const useAllCollections = (routeId: string) => {
  return useQuery({
    queryKey: ['allCollections', routeId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('waypoint_collections')
        .select('id, waypoint_id, status')
        .eq('route_id', routeId);
      if (error) throw new Error(error.message);
      return data as Pick<WaypointCollection, 'id' | 'waypoint_id' | 'status'>[];
    },
    enabled: !!routeId,
  });
};