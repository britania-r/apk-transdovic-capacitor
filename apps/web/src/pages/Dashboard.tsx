// File: apps/web/src/pages/Dashboard.tsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // <-- 1. Importar useLocation
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation(); // <-- 2. Obtener la información de la ubicación/ruta

  useEffect(() => {
    // 3. Verificamos si el estado 'fromLogin' existe y es verdadero
    const cameFromLogin = location.state?.fromLogin;

    if (cameFromLogin) {
      toast.success('¡Inicio de sesión exitoso!');
      
      // Opcional pero recomendado: Limpiamos el estado para que el toast no reaparezca
      // si el usuario navega hacia atrás y luego hacia adelante en el historial del navegador.
      window.history.replaceState({}, document.title)
    }
  }, [location]); // El efecto se re-evaluará si la ubicación cambia

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Dashboard Principal</h1>
        <p>
          Bienvenido, <strong>{user?.email || 'Usuario'}</strong>
        </p>
      </header>

      <div className={styles.content}>
        <p>¡Sistema de autenticación y rutas funcionando!</p>
        <p>Próximos pasos: Crear formularios, mostrar datos, etc.</p>
      </div>
    </div>
  );
};

export default Dashboard;