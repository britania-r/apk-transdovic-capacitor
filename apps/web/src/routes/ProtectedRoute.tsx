// File: apps/web/src/routes/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../components/layout/MainLayout';
import { useEffect } from 'react'; // <-- Importa useEffect

export const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  // LOG 1: Este log se ejecutará CADA VEZ que el componente se renderice.
  // Nos mostrará el estado actual de la sesión que ve el componente.

  // LOG 2: Este log se ejecutará SÓLO CUANDO el valor de 'session' cambie.
  useEffect(() => {
  }, [session]);


  // Mientras AuthContext está verificando la sesión inicial, no hacemos nada.
  // AuthProvider ya muestra un spinner a pantalla completa.
  if (loading) {
    return null; 
  }

  // Si no está cargando y NO hay sesión, redirigimos al login.
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si llegamos aquí, significa que SÍ hay sesión. Mostramos el contenido.
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};