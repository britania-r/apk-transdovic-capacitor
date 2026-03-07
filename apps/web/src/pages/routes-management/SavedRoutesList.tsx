import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupabase } from '@transdovic/shared';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UserTable.module.css';

// Definición de la interfaz para la data de la tabla
interface Route {
  id: string;
  route_date: string;
  status: string;
  programed_start_time: string;
  driver: { first_name: string; paternal_last_name: string } | null;
  vehicle: { plate: string } | null;
  route_waypoints: { count: number }[];
}

export const SavedRoutesList = () => {
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: routes, isLoading } = useQuery({
    queryKey: ['savedRoutes'],
    queryFn: async () => {
      console.log('📋 [SavedRoutesList] Cargando rutas guardadas...');
      
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, route_date, status, programed_start_time,
          driver:profiles(first_name, paternal_last_name),
          vehicle:vehicles(plate),
          route_waypoints(count)
        `)
        .order('route_date', { ascending: false })
        .returns<Route[]>();
      
      if (error) {
        console.error('❌ [SavedRoutesList] Error al cargar rutas:', error);
        throw error;
      }
      
      console.log('✅ [SavedRoutesList] Rutas cargadas:', data?.length || 0);
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ [SavedRoutesList] Eliminando ruta:', id);
      const supabase = getSupabase();
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) {
        console.error('❌ [SavedRoutesList] Error al eliminar:', error);
        throw error;
      }
      console.log('✅ [SavedRoutesList] Ruta eliminada exitosamente');
    },
    onSuccess: () => {
      toast.success('Ruta eliminada');
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      setRouteToDelete(null);
    },
    onError: (e: Error) => {
      console.error('💥 [SavedRoutesList] Error en mutación:', e);
      toast.error(e.message);
    }
  });

  if (isLoading) return <p>Cargando rutas...</p>;

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Conductor</th>
              <th>Vehículo</th>
              <th>Hora Salida</th>
              <th>Puntos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {routes?.map((route) => (
              <tr key={route.id}>
                <td>{format(parseISO(route.route_date), 'dd/MM/yyyy')}</td>
                <td>{route.driver ? `${route.driver.first_name} ${route.driver.paternal_last_name}` : 'No Asignado'}</td>
                <td>{route.vehicle?.plate || '-'}</td>
                <td>{route.programed_start_time || '-'}</td>
                <td style={{textAlign: 'center'}}>{route.route_waypoints[0]?.count || 0}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[route.status] || ''}`}>
                    {route.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link to={`/routes/list/${route.id}`} className={`${styles.actionButton} ${styles.detailsButton}`}>
                      <i className='bx bx-map-alt'></i>
                    </Link>
                    <button onClick={() => setRouteToDelete(route.id)} className={`${styles.actionButton} ${styles.deleteButton}`}>
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
        onConfirm={() => routeToDelete && deleteMutation.mutate(routeToDelete)}
        title="Eliminar Ruta"
        message="¿Seguro que deseas eliminar esta ruta importada?"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};