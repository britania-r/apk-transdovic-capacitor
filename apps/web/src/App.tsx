// File: apps/web/src/App.tsx

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRouter } from './routes';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- 1. Importar
import './styles/globals.css';

// 2. Crear una instancia del cliente de query.
const queryClient = new QueryClient();

function App() {
  return (
    // 3. Envolver la aplicación con el QueryClientProvider
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2000,
              style: {
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-primary)',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;