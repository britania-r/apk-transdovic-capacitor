// File: apps/web/src/pages/my-routes/active-route/hooks/useTankReadings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import type {
  TankReading,
  TankReadingInput,
  FarmTank,
  FarmTankWithType,
  ConversionType,
} from '../types';

// Re-exportar tipos para no romper imports existentes
export type { TankReading, TankReadingInput, FarmTankWithType };

// Helper para evitar inferencia 'never' en tablas sin tipos generados
const db = () => getSupabase() as ReturnType<typeof getSupabase> & {
  from: (table: string) => any;
};

// --- Hook: lecturas de todos los tanques de una colección ---

export const useTankReadings = (collectionId: string | undefined) => {
  const queryClient = useQueryClient();

  const readingsQuery = useQuery<TankReading[]>({
    queryKey: ['tankReadings', collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const { data, error } = await db()
        .from('tank_readings')
        .select('id, collection_id, tank_id, reading_cm, reading_mm, table_liters, manual_liters, factor, kg, kg_direct, temperature, lab_authorized, observation, photo_file')
        .eq('collection_id', collectionId);
      if (error) throw new Error(error.message);
      return (data ?? []) as TankReading[];
    },
    enabled: !!collectionId,
    staleTime: 1000 * 30, // 30s cache
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      tankId,
      input,
      collectionId: overrideId,
    }: {
      tankId: string;
      input: TankReadingInput;
      collectionId?: string;
    }) => {
      const activeId = overrideId || collectionId;
      if (!activeId) throw new Error('No hay colección activa');

      const existing = readingsQuery.data?.find(r => r.tank_id === tankId);

      if (existing) {
        const { data, error } = await db()
          .from('tank_readings')
          .update({
            reading_cm: input.reading_cm ?? null,
            reading_mm: input.reading_mm ?? null,
            table_liters: input.table_liters ?? null,
            manual_liters: input.manual_liters ?? null,
            factor: input.factor ?? 1.03,
            kg: input.kg ?? null,
            kg_direct: input.kg_direct ?? null,
            temperature: input.temperature ?? null,
            lab_authorized: input.lab_authorized ?? null,
            observation: input.observation ?? null,
            photo_file: input.photo_file ?? null,
          })
          .eq('id', existing.id)
          .select('id, collection_id, tank_id, reading_cm, reading_mm, table_liters, manual_liters, factor, kg, kg_direct, temperature, lab_authorized, observation, photo_file')
          .single();
        if (error) throw new Error(error.message);
        return data as TankReading;
      } else {
        const { data, error } = await db()
          .from('tank_readings')
          .insert({
            collection_id: activeId,
            tank_id: tankId,
            reading_cm: input.reading_cm ?? null,
            reading_mm: input.reading_mm ?? null,
            table_liters: input.table_liters ?? null,
            manual_liters: input.manual_liters ?? null,
            factor: input.factor ?? 1.03,
            kg: input.kg ?? null,
            kg_direct: input.kg_direct ?? null,
            temperature: input.temperature ?? null,
            lab_authorized: input.lab_authorized ?? null,
            observation: input.observation ?? null,
            photo_file: input.photo_file ?? null,
          })
          .select('id, collection_id, tank_id, reading_cm, reading_mm, table_liters, manual_liters, factor, kg, kg_direct, temperature, lab_authorized, observation, photo_file')
          .single();
        if (error) throw new Error(error.message);
        return data as TankReading;
      }
    },
    onSuccess: (_data, variables) => {
      const activeId = variables.collectionId || collectionId;
      queryClient.invalidateQueries({ queryKey: ['tankReadings', activeId] });
    },
    onError: (e: Error) => toast.error(`Error al guardar lectura: ${e.message}`),
  });

  const getReadingForTank = (tankId: string): TankReading | undefined => {
    return readingsQuery.data?.find(r => r.tank_id === tankId);
  };

  return {
    readings: readingsQuery.data ?? [],
    isLoading: readingsQuery.isLoading,
    saveReading: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    getReadingForTank,
  };
};

// --- Hook: tanques de una granja con su tipo de conversión ---

export const useFarmTanks = (farmId: string | undefined) => {
  return useQuery<FarmTankWithType[]>({
    queryKey: ['farmTanksWithType', farmId],
    queryFn: async () => {
      if (!farmId) return [];

      // 1. Traer tanques de la granja
      const { data: tanks, error: tanksError } = await db()
        .from('farm_tanks')
        .select('id, name, farm_id')
        .eq('farm_id', farmId)
        .order('name');
      if (tanksError) throw new Error(tanksError.message);
      if (!tanks || tanks.length === 0) return [];

      // 2. Obtener tipo de conversión por tanque
      const tankIds = (tanks as FarmTank[]).map(t => t.id);
      const { data: typeData, error: typeError } = await db()
        .from('tank_conversions')
        .select('tank_id, type')
        .in('tank_id', tankIds);

      const typeMap = new Map<string, ConversionType>();
      if (!typeError && typeData) {
        for (const row of typeData as { tank_id: string; type: string }[]) {
          if (!typeMap.has(row.tank_id)) {
            typeMap.set(row.tank_id, row.type as ConversionType);
          }
        }
      }

      return (tanks as FarmTank[]).map(tank => ({
        id: tank.id,
        name: tank.name,
        farm_id: tank.farm_id,
        conversion_type: typeMap.get(tank.id) ?? null,
      }));
    },
    enabled: !!farmId,
    staleTime: 1000 * 60 * 10,
  });
};