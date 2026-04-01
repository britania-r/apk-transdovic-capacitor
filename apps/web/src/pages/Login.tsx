// File: apps/web/src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.session) {
      navigate('/');
    }
  }, [auth.session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await auth.signIn({ email, password });
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/');
    } catch (error) {
      let errorMessage = 'Credenciales inválidas.';
      if (error instanceof Error && error.message.includes('Invalid login credentials')) {
        errorMessage = 'El correo o la contraseña son incorrectos.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (auth.session) return null;

  return (
    <div className={styles.page}>
      {/* Fondo decorativo */}
      <div className={styles.bgDecor}>
        <div className={styles.bgCircle1}></div>
        <div className={styles.bgCircle2}></div>
      </div>

      <div className={styles.card}>
        {/* Branding */}
        <div className={styles.branding}>
          <div className={styles.logoIcon}>
            <i className="bx bxs-truck"></i>
          </div>
          <h1 className={styles.brandName}>Transdovic</h1>
          <p className={styles.brandSub}>Panel de gestión</p>
        </div>

        {/* Separador */}
        <div className={styles.divider}></div>

        {/* Form */}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo electrónico
            </label>
            <div className={styles.inputWrapper}>
              <i className="bx bx-envelope"></i>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                autoComplete="email"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <div className={styles.inputWrapper}>
              <i className="bx bx-lock-alt"></i>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePassword}
                tabIndex={-1}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <i className="bx bx-loader-alt bx-spin"></i>
                Ingresando...
              </>
            ) : (
              <>
                <i className="bx bx-log-in"></i>
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Transdovic E.I.R.L. — Sistema interno
        </p>
      </div>
    </div>
  );
};

export default Login;