// File: apps/web/src/pages/my-routes/active-route/hooks/useTankConversion.ts
import { useState, useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';

interface ConversionResult {
  liters: number | null;
  isSearching: boolean;
  error: string | null;
}

/**
 * Hook para búsqueda instantánea en tabla de conversión de un tanque.
 * Usa las funciones RPC de Supabase para máxima velocidad.
 */
export const useTankConversion = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Búsqueda para tanque tipo DECIMAL (CM + MM → L)
   */
  const lookupDecimal = useCallback(async (
    tankId: string,
    cm: number,
    mm: number
  ): Promise<number | null> => {
    setIsSearching(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: rpcError } = await supabase
        .rpc('lookup_tank_conversion_decimal', {
          p_tank_id: tankId,
          p_cm: cm,
          p_mm: mm,
        });

      if (rpcError) {
        setError('Error en búsqueda');
        console.error('RPC decimal error:', rpcError);
        return null;
      }

      return data as number | null;
    } catch (err) {
      setError('Error de conexión');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Búsqueda para tanque tipo INTEGER (MM → L)
   */
  const lookupInteger = useCallback(async (
    tankId: string,
    mm: number
  ): Promise<number | null> => {
    setIsSearching(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: rpcError } = await supabase
        .rpc('lookup_tank_conversion_integer', {
          p_tank_id: tankId,
          p_mm: mm,
        });

      if (rpcError) {
        setError('Error en búsqueda');
        console.error('RPC integer error:', rpcError);
        return null;
      }

      return data as number | null;
    } catch (err) {
      setError('Error de conexión');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Búsqueda genérica: detecta el tipo y ejecuta el RPC correcto
   */
  const lookup = useCallback(async (
    tankId: string,
    type: 'decimal' | 'integer',
    values: { cm?: number; mm: number }
  ): Promise<number | null> => {
    if (type === 'decimal') {
      if (values.cm === undefined) {
        setError('CM es requerido para tipo decimal');
        return null;
      }
      return lookupDecimal(tankId, values.cm, values.mm);
    }
    return lookupInteger(tankId, values.mm);
  }, [lookupDecimal, lookupInteger]);

  return {
    lookup,
    lookupDecimal,
    lookupInteger,
    isSearching,
    error,
  };
};