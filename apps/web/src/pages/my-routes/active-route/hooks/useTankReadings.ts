// File: apps/web/src/pages/my-routes/active-route/hooks/useTankReadings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

// --- Tipos ---

export interface TankReading {
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
}

export interface TankReadingInput {
  reading_cm?: number | null;
  reading_mm?: number | null;
  table_liters?: number | null;
  manual_liters?: number | null;
  factor?: number;
  kg?: number | null;
  kg_direct?: number | null;
  temperature?: number | null;
  lab_authorized?: boolean | null;
  observation?: string | null;
}

export interface FarmTankWithType {
  id: string;
  name: string;
  farm_id: string;
  conversion_type: 'decimal' | 'integer' | null; // null = sin tabla
}

// --- Hook: lecturas de todos los tanques de una colección ---

export const useTankReadings = (collectionId: string | undefined) => {
  const queryClient = useQueryClient();

  const readingsQuery = useQuery({
    queryKey: ['tankReadings', collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tank_readings')
        .select('*')
        .eq('collection_id', collectionId);
      if (error) throw new Error(error.message);
      return data as TankReading[];
    },
    enabled: !!collectionId,
  });

  // Crear o actualizar lectura de un tanque
  const saveMutation = useMutation({
    mutationFn: async ({ tankId, input }: { tankId: string; input: TankReadingInput }) => {
      if (!collectionId) throw new Error('No hay colección activa');

      const supabase = getSupabase();
      const existing = readingsQuery.data?.find(r => r.tank_id === tankId);

      if (existing) {
        const { data, error } = await supabase
          .from('tank_readings')
          .update(input as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('tank_readings')
          .insert({
            collection_id: collectionId,
            tank_id: tankId,
            factor: 1.03,
            ...input,
          } as any)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tankReadings', collectionId] });
    },
    onError: (e: Error) => toast.error(`Error al guardar lectura: ${e.message}`),
  });

  // Helper: obtener lectura de un tanque específico
  const getReadingForTank = (tankId: string): TankReading | undefined => {
    return readingsQuery.data?.find(r => r.tank_id === tankId);
  };

  return {
    readings: readingsQuery.data || [],
    isLoading: readingsQuery.isLoading,
    saveReading: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    getReadingForTank,
  };
};

// --- Hook: tanques de una granja con su tipo de conversión ---

export const useFarmTanks = (farmId: string | undefined) => {
  return useQuery({
    queryKey: ['farmTanksWithType', farmId],
    queryFn: async () => {
      if (!farmId) return [];

      const supabase = getSupabase();

      // 1. Traer tanques de la granja
      const { data: tanks, error: tanksError } = await supabase
        .from('farm_tanks')
        .select('id, name, farm_id')
        .eq('farm_id', farmId)
        .order('name');
      if (tanksError) throw new Error(tanksError.message);
      if (!tanks || tanks.length === 0) return [];

      // 2. Para cada tanque, verificar si tiene conversiones y de qué tipo
      const tankIds = tanks.map(t => t.id);
      const { data: conversions, error: convError } = await supabase
        .from('tank_conversions')
        .select('tank_id, type')
        .in('tank_id', tankIds)
        .limit(1);

      if (convError) throw new Error(convError.message);

      // Construir mapa de tipo por tanque
      // Necesitamos saber el tipo de cada tanque, no solo el primero global
      const { data: allTypes, error: allTypesError } = await supabase
        .rpc('get_tank_conversion_types', { p_tank_ids: tankIds });

      // Si el RPC no existe, fallback con query directa
      let typeMap = new Map<string, string>();

      if (allTypesError) {
        // Fallback: query agrupada
        const { data: typeData } = await supabase
          .from('tank_conversions')
          .select('tank_id, type')
          .in('tank_id', tankIds);

        if (typeData) {
          for (const row of typeData) {
            if (!typeMap.has(row.tank_id)) {
              typeMap.set(row.tank_id, row.type);
            }
          }
        }
      } else if (allTypes) {
        for (const row of allTypes) {
          typeMap.set(row.tank_id, row.type);
        }
      }

      return tanks.map(tank => ({
        id: tank.id,
        name: tank.name,
        farm_id: tank.farm_id,
        conversion_type: (typeMap.get(tank.id) as 'decimal' | 'integer') || null,
      })) as FarmTankWithType[];
    },
    enabled: !!farmId,
    staleTime: 1000 * 60 * 10, // 10 min cache — los tanques no cambian frecuentemente
  });
};