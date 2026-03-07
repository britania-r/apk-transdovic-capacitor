// File: apps/web/src/pages/users/UsersPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { UserTable } from './UserTable';
import { UserFormModal } from './UserFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './UsersPage.module.css';

export interface UserProfile {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  role: string;
  dni: string;
  drivers_license: string | null;
  date_of_birth: string;
  email: string;
}

export type UpdateUserArgs = {
  user_id: string;
  new_first_name: string;
  new_paternal_last_name: string;
  new_maternal_last_name: string;
  new_role: string;
  new_dni: string;
  new_drivers_license: string | null;
  new_date_of_birth: string;
};

const fetchUsers = async (): Promise<UserProfile[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_all_users_with_email');
  if (error) throw new Error(error.message);
  return data || [];
};

const createUserViaFunction = async (formData: any) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: formData.email,
      password: formData.password,
      profileData: {
        first_name: formData.first_name,
        paternal_last_name: '',
        maternal_last_name: '',
        role: formData.role,
        dni: formData.dni,
        drivers_license: formData.drivers_license || null,
        date_of_birth: formData.date_of_birth,
      },
    },
  });
  if (error) throw new Error(error.message);
  return data;
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

const deleteUser = async (userId: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
  if (error) throw new Error(error.message);
};

export const UsersPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u =>
      u.first_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.dni.includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const createMutation = useMutation({
    mutationFn: createUserViaFunction,
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error al crear: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onError: (e: Error) => toast.error(`Error al actualizar: ${e.message}`),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error al actualizar contraseña: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error al eliminar: ${e.message}`),
  });

  const handleCloseModals = () => {
    setSelectedUser(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleFormSubmit = (formData: any, hasNewPassword: boolean) => {
    if (selectedUser) {
      const payload: UpdateUserArgs = {
        user_id: selectedUser.id,
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
          queryClient.invalidateQueries({ queryKey: ['users'] });
          if (hasNewPassword) {
            updatePasswordMutation.mutate({ userId: selectedUser.id, newPassword: formData.password });
          } else {
            toast.success('Usuario actualizado');
            handleCloseModals();
          }
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Usuarios</h1>
            <span className={styles.count}>{users.length}</span>
          </div>

          {/* Buscador — crece para ocupar espacio */}
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, email, DNI o rol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          {/* Botón nuevo */}
          <button
            onClick={() => { setSelectedUser(null); setFormModalOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando usuarios...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredUsers.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-user-x"></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : 'No hay usuarios registrados'}</span>
        </div>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <UserTable
          users={filteredUsers}
          onEdit={u => { setSelectedUser(u); setFormModalOpen(true); }}
          onDelete={u => { setSelectedUser(u); setConfirmModalOpen(true); }}
        />
      )}

      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        userToEdit={selectedUser}
        isLoading={createMutation.isPending || updateMutation.isPending || updatePasswordMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar a ${selectedUser?.first_name}? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};