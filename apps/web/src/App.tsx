// File: apps/web/src/App.tsx
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRouter } from './routes';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScrollToTop } from './components/ui/ScrollToTop';
import './styles/globals.css';

const queryClient = new QueryClient();

function App() {
  return (
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
          <ScrollToTop />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;