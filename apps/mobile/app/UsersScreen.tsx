// File: apps/mobile/app/UsersScreen.tsx

import { useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { Ionicons } from '@expo/vector-icons';
import { UserFormModal } from './UserFormModal';

// ============================================================================
// 1. TIPOS Y FUNCIONES DE API (Todo en un solo lugar)
// ============================================================================

// La estructura de datos de un usuario, basada en la función RPC
export interface UserProfile {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  role: string;
  email: string;
  dni: string;
  drivers_license: string | null;
  date_of_birth: string;
}

// Tipos para los argumentos que esperan nuestras funciones RPC/Edge
export type CreateUserArgs = {
  email: string;
  password?: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  role: string;
  dni: string;
  drivers_license: string | null;
  date_of_birth: string;
};

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

const updateUserPassword = async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('update-user', { body: { userId, newPassword } });
    if (error) throw new Error(error.message);
    return data;
};

const deleteUser = async (userId: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId } });
    if (error) throw new Error(error.message);
    return data;
};

// ============================================================================
// 2. COMPONENTE PRINCIPAL
// ============================================================================

export const UsersScreen = ({ navigation }: any) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery<UserProfile[], Error>({ 
        queryKey: ['users'], 
        queryFn: fetchUsers 
    });
    
    const handleMutationSuccess = (message: string) => {
      Alert.alert('Éxito', message);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setSelectedUser(null);
    };
    
    const handleMutationError = (e: Error) => {
        Alert.alert('Error', e.message);
    };
    
    const createMutation = useMutation({ mutationFn: createUserViaFunction, onSuccess: () => handleMutationSuccess('Usuario creado'), onError: handleMutationError });
    const updateMutation = useMutation({ mutationFn: updateUser, onSuccess: () => handleMutationSuccess('Perfil actualizado'), onError: handleMutationError });
    const passwordMutation = useMutation({ mutationFn: updateUserPassword, onSuccess: () => handleMutationSuccess('Contraseña actualizada'), onError: handleMutationError });
    const deleteMutation = useMutation({ mutationFn: deleteUser, onSuccess: () => handleMutationSuccess('Usuario eliminado'), onError: handleMutationError });
    
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
                    if (hasNewPassword) {
                        passwordMutation.mutate({ userId: selectedUser.id, newPassword: formData.password });
                    } else {
                        handleMutationSuccess('Perfil actualizado');
                    }
                }
            });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (user: UserProfile) => {
        Alert.alert('Eliminar Usuario', `¿Seguro que quieres eliminar a ${user.first_name}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(user.id) }
        ]);
    };
    
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable onPress={() => { setSelectedUser(null); setModalOpen(true); }} style={{ paddingHorizontal: 10 }}>
                    <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
                </Pressable>
            ),
        });
    }, [navigation]);

    if (isLoading) return <ActivityIndicator style={styles.center} size="large" />;
    if (error) return <View style={styles.center}><Text>Error: {error.message}</Text></View>;

    return (
        <View style={styles.container}>
            {users && users.length > 0 ? (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            <View>
                                <Text style={styles.userName}>{item.first_name} {item.paternal_last_name}</Text>
                                <Text style={styles.userRole}>{item.role}</Text>
                            </View>
                            <View style={styles.actions}>
                                <Pressable onPress={() => { setSelectedUser(item); setModalOpen(true); }}>
                                    <Ionicons name="pencil-outline" size={24} color="#f59e0b" />
                                </Pressable>
                                <Pressable onPress={() => handleDelete(item)}>
                                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                                </Pressable>
                            </View>
                        </View>
                    )}
                />
            ) : (
                <View style={styles.center}><Text>No se encontraron usuarios.</Text></View>
            )}
            <UserFormModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleFormSubmit}
                userToEdit={selectedUser}
                isLoading={createMutation.isPending || updateMutation.isPending || passwordMutation.isPending}
            />
        </View>
    );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f0f2f5' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  userName: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  userRole: { 
    fontSize: 14, 
    color: '#666' 
  },
  actions: { 
    flexDirection: 'row', 
    gap: 20 
  },
});