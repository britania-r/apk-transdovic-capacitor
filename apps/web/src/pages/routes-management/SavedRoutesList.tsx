// File: apps/web/src/pages/routes-management/SavedRoutesList.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupabase } from '@transdovic/shared';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UserTable.module.css';

// --- TIPOS DE DATOS ---
interface SavedRoute {
  id: string;
  route_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  distance_km: number | null;
  estimated_time_min: number | null;
  toll_charges: number | null;
  driver: {
    first_name: string;
    paternal_last_name: string;
  } | null;
  vehicle: {
    plate: string;
  } | null;
}

const statusMap: { [key: string]: string } = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

// --- FUNCIONES DE API ---
const fetchSavedRoutes = async (): Promise<SavedRoute[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('routes')
    .select(`
      id, 
      route_date, 
      status, 
      distance_km, 
      estimated_time_min, 
      toll_charges,
      driver: profiles (first_name, paternal_last_name),
      vehicle: vehicles (plate)
    `)
    .order('route_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const deleteRoute = async (routeId: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('routes').delete().eq('id', routeId);
  if (error) throw new Error(error.message);
};

// --- COMPONENTE PRINCIPAL ---
export const SavedRoutesList = () => {
  const [routeToDelete, setRouteToDelete] = useState<SavedRoute | null>(null);
  const queryClient = useQueryClient();

  const { data: routes, isLoading, error } = useQuery<SavedRoute[], Error>({
    queryKey: ['savedRoutes'],
    queryFn: fetchSavedRoutes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      toast.success('Ruta eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      setRouteToDelete(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
  
  if (isLoading) return <p>Cargando rutas guardadas...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Conductor</th>
              <th>Vehículo</th>
              <th>Estado</th>
              <th>Distancia</th>
              <th>Tiempo Est.</th>
              <th>N° de Peajes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {routes && routes.map((route) => (
              <tr key={route.id}>
                <td>{format(parseISO(route.route_date), 'dd/MM/yyyy', { locale: es })}</td>
                <td>{route.driver ? `${route.driver.first_name} ${route.driver.paternal_last_name}` : 'No asignado'}</td>
                <td>{route.vehicle ? route.vehicle.plate : '-'}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[route.status]}`}>
                    {statusMap[route.status] || route.status}
                  </span>
                </td>
                <td>{route.distance_km ? `${route.distance_km} km` : '-'}</td>
                <td>{route.estimated_time_min ? `${route.estimated_time_min} min` : '-'}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {route.toll_charges !== null && route.toll_charges !== undefined ? route.toll_charges : '-'}
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link to={`/routes/list/${route.id}`} className={`${styles.actionButton} ${styles.detailsButton}`} title="Ver Detalles de la Ruta">
                      <i className='bx bx-map-alt'></i>
                    </Link>
                    <button onClick={() => setRouteToDelete(route)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Eliminar Ruta">
                      <i className='bx bx-trash'></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={!!routeToDelete}
        onClose={() => setRouteToDelete(null)}
        onConfirm={() => routeToDelete && deleteMutation.mutate(routeToDelete.id)}
        title="Confirmar Eliminación de Ruta"
        message={`¿Estás seguro de que quieres eliminar la ruta del ${routeToDelete ? format(parseISO(routeToDelete.route_date), 'dd/MM/yyyy') : ''}?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};