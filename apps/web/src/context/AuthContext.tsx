// File: apps/web/src/context/AuthContext.tsx

import { createContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import type { Session, User, AuthChangeEvent, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { getSupabase } from '@transdovic/shared';
import { Spinner } from '../components/ui/Spinner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // LA GRAN MEJORA: Exponemos la función de login desde el contexto
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    // Verificamos la sesión al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // El listener sigue siendo importante para logouts y actualizaciones en otras pestañas
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ESTA ES LA FUNCIÓN CLAVE QUE SOLUCIONA TODO
  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      throw error;
    }

    // Actualizamos el estado MANUALMENTE y de forma INMEDIATA
    // Esto fuerza la re-renderización de ProtectedRoute
    setSession(data.session);
    setUser(data.user);
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
  };

  // No renderizamos nada hasta que la carga inicial de la sesión haya terminado
  if (loading) {
    return <Spinner fullPage={true} />;
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};