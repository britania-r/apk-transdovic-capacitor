// Exportar constantes
export const APP_NAME = 'Transdovic';

// Exportar funciones de configuración
export { getSupabaseConfig } from './config/supabase';
export { getFirebaseConfig } from './config/firebase';
export { getGoogleMapsConfig } from './config/maps';

// Exportar clientes
export { initializeSupabase, getSupabase } from './lib/supabase';
export { initializeFirebase, getFirebaseApp, getFirebaseMessaging } from './lib/firebase';

// Exportar tipos
export type * from './types/maps';