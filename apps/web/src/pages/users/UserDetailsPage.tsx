// File: apps/web/src/pages/users/UserDetailsPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserFormModal } from './UserFormModal';
import styles from './UserDetailsPage.module.css';
import type { UserProfile, UpdateUserArgs } from './UsersPage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const fetchUserById = async (userId: string | undefined): Promise<UserProfile | null> => {
  if (!userId) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_all_users_with_email');
  if (error) throw new Error(error.message);
  return data?.find((u: UserProfile) => u.id === userId) || null;
};

const updateUser = async (args: UpdateUserArgs) => {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('update_user_profile', args);
  if (error) throw new Error(error.message);
};

const updateUserPassword = async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('update-user', {
    body: { userId, newPassword },
  });
  if (error) throw new Error(error.message);
  return data;
};

const ROLE_STYLES: Record<string, string> = {
  'Gerente':                  styles.roleGerente,
  'Administrador':            styles.roleAdmin,
  'Conductor carga pesada':   styles.roleConductor,
  'Asistente administrativo': styles.roleAsistente,
  'Asistente de procesos':    styles.roleAsistente,
  'Conductor de patio':       styles.roleConductor,
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

export const UserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [isEditOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleFormSubmit = (formData: any, hasNewPassword: boolean) => {
    if (!user) return;
    const payload: UpdateUserArgs = {
      user_id: user.id,
      new_first_name: formData.first_name,
      new_paternal_last_name: '',
      new_maternal_last_name: '',
      new_role: formData.role,
      new_dni: formData.dni,
      new_drivers_license: formData.drivers_license || null,
      new_date_of_birth: formData.date_of_birth,
    };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        if (hasNewPassword) {
          updatePasswordMutation.mutate({ userId: user.id, newPassword: formData.password });
        } else {
          toast.success('Usuario actualizado');
          setEditOpen(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando usuario...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>{error ? (error as Error).message : 'Usuario no encontrado'}</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/users" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver a usuarios
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className={styles.editBtn}
          >
            <i className="bx bx-pencil"></i>
            Editar
          </button>
        </div>

        {/* Avatar + nombre + rol */}
        <div className={styles.headerProfile}>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{user.first_name}</h1>
            <span className={`${styles.roleBadge} ${ROLE_STYLES[user.role] ?? styles.roleDefault}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Grid de datos rápidos */}
        <div className={styles.headerGrid}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Email</span>
            <span className={styles.headerValue}>{user.email}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>DNI</span>
            <span className={styles.headerValue}>{user.dni}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Brevete</span>
            <span className={styles.headerValue}>{user.drivers_license || '—'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Fecha de nacimiento</span>
            <span className={styles.headerValue}>{formatDate(user.date_of_birth)}</span>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <i className="bx bx-user"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Nombre completo</span>
            <span className={styles.statValue}>{user.first_name}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="bx bx-id-card"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Documento</span>
            <span className={styles.statValue}>{user.dni}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <i className="bx bx-car"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Licencia</span>
            <span className={styles.statValue}>{user.drivers_license || 'No registrada'}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
            <i className="bx bx-calendar"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Nacimiento</span>
            <span className={styles.statValue}>{formatDate(user.date_of_birth)}</span>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleFormSubmit}
        userToEdit={user}
        isLoading={updateMutation.isPending || updatePasswordMutation.isPending}
      />
    </div>
  );
};