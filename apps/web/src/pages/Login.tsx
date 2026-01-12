// File: apps/web/src/pages/Login.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. Importar useNavigate
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const navigate = useNavigate(); // <-- 2. Obtener la función de navegación

  // --- SOLUCIÓN PARTE A: REDIRECCIÓN PROACTIVA ---
  // Este useEffect se ejecuta cuando el componente se carga.
  // Si detecta que ya hay una sesión, redirige inmediatamente.
  useEffect(() => {
    if (auth.session) {
      navigate('/');
    }
  }, [auth.session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamamos a la función signIn de nuestro contexto
      await auth.signIn({ email, password });
      
      // --- SOLUCIÓN PARTE B: REDIRECCIÓN EXPLÍCITA ---
      // Si la función anterior no lanzó un error, el login fue exitoso.
      // Navegamos explícitamente al dashboard.
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/');

    } catch (error) {
      console.error('[Login] signIn function failed:', error);
      let errorMessage = 'Credenciales inválidas.';
      if (error instanceof Error) {
        // A veces Supabase no da un mensaje claro, así que lo personalizamos
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'El correo o la contraseña son incorrectos.';
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si ya hay sesión, no renderizamos el formulario para evitar un parpadeo
  if (auth.session) {
    return null;
  }

  // El JSX no cambia
  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <h2>Iniciar Sesión</h2>
        <p>Bienvenido al panel de Transdovic</p>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

export default Login;