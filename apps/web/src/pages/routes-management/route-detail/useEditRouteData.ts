// File: apps/web/src/pages/routes-management/route-detail/useEditRouteData.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface VehicleOption {
  id: string;
  plate: string;
  capacity_kg: number;
}

export interface DriverOption {
  id: string;
  first_name: string;
}

export interface FarmOption {
  id: string;
  name: string;
  ruc: string;
  latitude: number;
  longitude: number;
}

export const useEditRouteData = () => {
  const vehiclesQuery = useQuery({
    queryKey: ['editRoute-vehicles'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate, capacity_kg')
        .order('plate');
      if (error) throw error;
      return data as VehicleOption[];
    }
  });

  const driversQuery = useQuery({
    queryKey: ['editRoute-drivers'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('role', 'Conductor carga pesada')
        .order('first_name');
      if (error) throw error;
      return data as DriverOption[];
    }
  });

  const farmsQuery = useQuery({
    queryKey: ['editRoute-farms'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('farms')
        .select('id, name, ruc, latitude, longitude')
        .order('name');
      if (error) throw error;
      return data as FarmOption[];
    }
  });

  return {
    vehicles: vehiclesQuery.data || [],
    drivers: driversQuery.data || [],
    farms: farmsQuery.data || [],
    isLoading: vehiclesQuery.isLoading || driversQuery.isLoading || farmsQuery.isLoading
  };
};