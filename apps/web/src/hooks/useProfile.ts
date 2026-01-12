// File: apps/web/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useAuth } from './useAuth';

// 1. Definimos una interfaz para la estructura de nuestros datos de perfil
// Esto debe coincidir con las columnas de tu tabla 'profiles' en Supabase.
interface Profile {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  role: 'Gerente' | 'Administrador' | 'Conductor carga pesada' | 'Asistente administrativo' | 'Asistente de procesos' | 'Conductor de patio';
  dni: string;
  drivers_license?: string;
  date_of_birth: string;
}

const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    // Si el perfil no existe, Supabase devuelve un error, lo cual es normal.
    // En ese caso, simplemente devolvemos null.
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

export const useProfile = () => {
  const { user } = useAuth();
  
  // 2. Añadimos el tipo a useQuery para que TypeScript sepa qué esperar.
  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user,
  });
};