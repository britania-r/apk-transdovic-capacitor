// File: apps/web/src/pages/users/UserDetailsPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './UserDetailsPage.module.css';

// Función para obtener un solo usuario
const fetchUserById = async (userId: string | undefined) => {
  if (!userId) return null;
  const supabase = getSupabase();
  // Usamos la misma RPC, pero filtramos por ID
  const { data, error } = await supabase.rpc('get_all_users_with_email');
  if (error) throw new Error(error.message);

  const user = data?.find(u => u.id === userId);
  return user || null;
};

export const UserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
  });

  if (isLoading) return <p>Cargando detalles del usuario...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {(error as Error).message}</p>;
  if (!user) return <p>Usuario no encontrado.</p>;

  return (
    <div className={styles.detailsContainer}>
      <Link to="/users" className={styles.backLink}>
        <i className='bx bx-arrow-back'></i> Volver a la lista
      </Link>
      <h1>Detalles de {user.first_name} {user.paternal_last_name}</h1>
      
      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Nombre Completo</span>
          <span className={styles.value}>{`${user.first_name} ${user.paternal_last_name} ${user.maternal_last_name}`}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Correo Electrónico</span>
          <span className={styles.value}>{user.email}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Rol</span>
          <span className={styles.value}>{user.role}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>DNI</span>
          <span className={styles.value}>{user.dni}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Brevete</span>
          <span className={styles.value}>{user.drivers_license || 'No especificado'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Fecha de Nacimiento</span>
          <span className={styles.value}>{format(parseISO(user.date_of_birth), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
        </div>
      </div>
    </div>
  );
};