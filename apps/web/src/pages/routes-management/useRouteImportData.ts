import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import type { ReferenceData } from '../../utils/excel-utils';

// Definimos interfaces locales para tipar la respuesta de Supabase
interface VehicleRow { id: string; plate: string; }
interface DriverRow { id: string; first_name: string; }
interface FarmRow { id: string; name: string; ruc: string; }

export const useRouteImportData = () => {
  return useQuery<ReferenceData>({
    queryKey: ['routeImportReferenceData'],
    queryFn: async () => {
      const supabase = getSupabase();

      // 1. Obtener Vehículos (Tipado explícito)
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, plate')
        .returns<VehicleRow[]>();

      // 2. Obtener Conductores
      const { data: drivers } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('role', 'Conductor carga pesada')
        .returns<DriverRow[]>();

      // 3. Obtener Granjas
      const { data: farms } = await supabase
        .from('farms')
        .select('id, name, ruc')
        .returns<FarmRow[]>();

      // --- CONSTRUIR MAPAS HASH ---
      
      const vehiclesMap = new Map<string, string>();
      vehicles?.forEach(v => {
        if (v.plate) vehiclesMap.set(v.plate.trim().toUpperCase(), v.id);
      });

      const driversMap = new Map<string, string>();
      drivers?.forEach(d => {
        if (d.first_name) driversMap.set(d.first_name.trim(), d.id);
      });

      const farmsMap = new Map<string, { id: string; name: string }>();
      farms?.forEach(f => {
        if (f.ruc) farmsMap.set(f.ruc.trim(), { id: f.id, name: f.name });
      });

      return {
        vehicles: vehiclesMap,
        drivers: driversMap,
        farms: farmsMap
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};