// File: apps/mobile/config/services.ts
import { initializeSupabase, initializeFirebase } from '@transdovic/shared';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa AsyncStorage

// Inicializar Supabase
export const supabase = initializeSupabase(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  // LA MODIFICACIÓN: Pasamos el objeto de opciones para React Native
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Inicializar Firebase (esto se queda igual)
export const firebaseApp = initializeFirebase({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
});

console.log('Mobile services initialized with persistent session storage.');