// File: apps/web/src/pages/guides/hooks/useGuidesByDate.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

export interface GuideEntry {
  id: string;
  waypoint_id: string;
  route_id: string;
  status: string;
  guia_transportista_number: string | null;
  guia_remision_number: string | null;
  guia_transportista_file: string | null;
  guia_remision_file: string | null;
  precinto_ingreso: string | null;
  precinto_salida: string | null;
  route: {
    route_date: string;
    sap_route_id: string | null;
    programed_start_time: string;
    driver: { first_name: string; paternal_last_name: string } | null;
    vehicle: { plate: string } | null;
  } | null;
  waypoint: {
    stop_order: number;
    farm: { name: string; ruc: string } | null;
  } | null;
}

export interface GuidesByRoute {
  routeId: string;
  sapRouteId: string;
  driverName: string;
  plate: string;
  startTime: string;
  entries: GuideEntry[];
}

// Fecha de hoy en zona horaria de Perú (UTC-5)
const getTodayPeru = () => {
  const now = new Date();
  const peruOffset = -5 * 60;
  const localOffset = now.getTimezoneOffset();
  const peruTime = new Date(now.getTime() + (localOffset + peruOffset) * 60000);
  return peruTime.toISOString().split('T')[0];
};

export const useGuidesByDate = (dateFilter?: string) => {
  const date = dateFilter || getTodayPeru();

  return useQuery({
    queryKey: ['guidesByDate', date],
    queryFn: async () => {
      const supabase = getSupabase();

      // Traer todas las colecciones que tengan al menos un número de guía
      // para rutas de la fecha seleccionada
      const { data, error } = await supabase
        .from('waypoint_collections')
        .select(`
          id, waypoint_id, route_id, status,
          guia_transportista_number, guia_remision_number,
          guia_transportista_file, guia_remision_file,
          precinto_ingreso, precinto_salida,
          route:routes!inner(
            route_date, sap_route_id, programed_start_time,
            driver:profiles(first_name, paternal_last_name),
            vehicle:vehicles(plate)
          ),
          waypoint:route_waypoints(
            stop_order,
            farm:farms(name, ruc)
          )
        `)
        .eq('routes.route_date', date)
        .order('guia_transportista_number', { ascending: true });

      if (error) throw new Error(error.message);

      const entries = (data || []) as unknown as GuideEntry[];

      // Agrupar por ruta
      const groupMap = new Map<string, GuidesByRoute>();

      for (const entry of entries) {
        if (!groupMap.has(entry.route_id)) {
          const route = entry.route;
          const driverName = route?.driver
            ? `${route.driver.first_name} ${route.driver.paternal_last_name}`
            : 'Sin conductor';

          groupMap.set(entry.route_id, {
            routeId: entry.route_id,
            sapRouteId: route?.sap_route_id || '—',
            driverName,
            plate: route?.vehicle?.plate || '—',
            startTime: route?.programed_start_time || '—',
            entries: [],
          });
        }
        groupMap.get(entry.route_id)!.entries.push(entry);
      }

      // Ordenar entries dentro de cada grupo por guia_transportista_number
      for (const group of groupMap.values()) {
        group.entries.sort((a, b) => {
          const numA = a.guia_transportista_number || '';
          const numB = b.guia_transportista_number || '';
          return numA.localeCompare(numB, undefined, { numeric: true });
        });
      }

      return Array.from(groupMap.values());
    },
  });
};