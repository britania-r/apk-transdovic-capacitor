// File: apps/web/src/pages/routes-management/RoutesContent.tsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

import { RoutesTable } from './RoutesTable';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

// --- Tipos ---
export interface Route {
  id: string;
  route_date: string;
  status: string;
  programed_start_time: string;
  sap_route_id: string | null;
  driver: { first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: { count: number }[];
}

// --- API ---
const fetchRoutes = async (): Promise<Route[]> => {
  const { data, error } = await getSupabase()
    .from('routes')
    .select(`
      id, route_date, status, programed_start_time, sap_route_id,
      driver:profiles(first_name, paternal_last_name),
      vehicle:vehicles(plate),
      route_waypoints(count)
    `)
    .order('route_date', { ascending: false })
    .returns<Route[]>();
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteRoute = async (id: string) => {
  const { error } = await getSupabase().from('routes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Props ---
interface RoutesContentProps {
  dateFilter: string;
  search: string;
  onCountChange: (count: number) => void;
}

export const RoutesContent = ({ dateFilter, search, onCountChange }: RoutesContentProps) => {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: routes = [], isLoading, error } = useQuery<Route[], Error>({
    queryKey: ['savedRoutes'],
    queryFn: fetchRoutes,
  });

  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (dateFilter) {
      result = result.filter(r => r.route_date === dateFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        (r.driver && `${r.driver.first_name} ${r.driver.paternal_last_name}`.toLowerCase().includes(q)) ||
        (r.vehicle && r.vehicle.plate.toLowerCase().includes(q)) ||
        (r.sap_route_id && r.sap_route_id.toLowerCase().includes(q)) ||
        r.status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [routes, search, dateFilter]);

  useEffect(() => {
    onCountChange(filteredRoutes.length);
  }, [filteredRoutes.length, onCountChange]);

  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      toast.success('Ruta eliminada');
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      setRouteToDelete(null);
      setConfirmModalOpen(false);
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleDeleteRequest = (routeId: string) => {
    setRouteToDelete(routeId);
    setConfirmModalOpen(true);
  };

  return (
    <>
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando rutas...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredRoutes.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-map-alt"></i>
          <span>
            {search || dateFilter
              ? 'Sin resultados para los filtros aplicados'
              : 'No hay rutas registradas'}
          </span>
        </div>
      )}

      {!isLoading && filteredRoutes.length > 0 && (
        <RoutesTable
          routes={filteredRoutes}
          onDelete={handleDeleteRequest}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRouteToDelete(null); }}
        onConfirm={() => routeToDelete && deleteMutation.mutate(routeToDelete)}
        title="Eliminar ruta"
        message="¿Estás seguro de eliminar esta ruta? Esta acción es irreversible."
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
};