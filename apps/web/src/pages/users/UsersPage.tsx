// File: apps/web/src/pages/users/UsersPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

// Importa los componentes de UI que ya creamos
import { UserTable } from './UserTable';
import { UserFormModal } from './UserFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './UsersPage.module.css';

// ============================================================================
// 1. TIPOS Y FUNCIONES DE API
// ============================================================================

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

// --- Funciones de API ---

const fetchUsers = async (): Promise<UserProfile[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_all_users_with_email');
  if (error) throw new Error(error.message);
  return data || [];
};

const createUserViaFunction = async (formData: any) => {
  const supabase = getSupabase();
  const payload = {
    email: formData.email,
    password: formData.password,
    profileData: {
      first_name: formData.first_name,
      paternal_last_name: formData.paternal_last_name,
      maternal_last_name: formData.maternal_last_name,
      role: formData.role,
      dni: formData.dni,
      drivers_license: formData.drivers_license || null,
      date_of_birth: formData.date_of_birth,
    }
  };
  const { data, error } = await supabase.functions.invoke('create-user', { body: payload });
  if (error) throw new Error(error.message);
  return data;
};

const updateUser = async (args: UpdateUserArgs) => {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('update_user_profile', args);
  if (error) throw new Error(error.message);
};

const updateUserPassword = async ({ userId, newPassword }: { userId: string, newPassword: string }) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('update-user', {
    body: { userId, newPassword }
  });
  if (error) throw new Error(error.message);
  return data;
};

const deleteUser = async (userId: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke('delete-user', {
    body: { userId }
  });
  if (error) throw new Error(error.message);
  return data;
};

// ============================================================================
// 2. COMPONENTE PRINCIPAL DE LA PÁGINA
// ============================================================================

export const UsersPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

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
    onSuccess: () => {
      toast.success('Datos del perfil actualizados');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // No cerramos el modal aquí, esperamos a la mutación de la contraseña si existe
    },
    onError: (e: Error) => toast.error(`Error al actualizar perfil: ${e.message}`),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente');
      handleCloseModals(); // Cerramos el modal solo después de que todo termine
    },
    onError: (e: Error) => toast.error(`Error al actualizar contraseña: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Usuario eliminado exitosamente');
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
  
  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormModalOpen(true);
  };
  
  const handleOpenEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (user: UserProfile) => {
    setSelectedUser(user);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (formData: any, hasNewPassword: boolean) => {
    if (selectedUser) {
      const profilePayload: UpdateUserArgs = {
        user_id: selectedUser.id,
        new_first_name: formData.first_name,
        new_paternal_last_name: formData.paternal_last_name,
        new_maternal_last_name: formData.maternal_last_name,
        new_role: formData.role,
        new_dni: formData.dni,
        new_drivers_license: formData.drivers_license || null,
        new_date_of_birth: formData.date_of_birth,
      };

      updateMutation.mutate(profilePayload, {
        onSuccess: () => {
          // Si hay una nueva contraseña, la actualizamos DESPUÉS de actualizar el perfil
          if (hasNewPassword) {
            updatePasswordMutation.mutate({ userId: selectedUser.id, newPassword: formData.password });
          } else {
            // Si no hay nueva contraseña, cerramos el modal ahora
            handleCloseModals();
          }
        }
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };
  
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Usuarios</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Agregar Usuario
        </button>
      </header>

      {isLoading && <p>Cargando usuarios...</p>}
      
      {error && <p style={{ color: 'red' }}>Error al cargar datos: {error.message}</p>}
      
      {users && users.length === 0 && <p>No se encontraron usuarios. ¡Crea el primero!</p>}
      
      {users && users.length > 0 && (
        <UserTable
          users={users}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
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
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar al usuario ${selectedUser?.first_name}? Esta acción es irreversible.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};