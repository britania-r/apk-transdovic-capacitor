// File: packages/shared/src/lib/supabase.ts
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

// LA MODIFICACIÓN: Añadimos un tercer parámetro opcional 'options'
export const initializeSupabase = (
  url: string, 
  anonKey: string, 
  // Este tipo viene de la librería @supabase/supabase-js
  options?: SupabaseClientOptions<"public"> 
) => {
  // Y pasamos las opciones directamente al crear el cliente
  supabaseClient = createClient(url, anonKey, options); 
  return supabaseClient;
};

export const getSupabase = () => {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initializeSupabase first.');
  }
  return supabaseClient;
};