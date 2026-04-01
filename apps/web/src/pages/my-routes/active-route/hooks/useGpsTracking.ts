// File: apps/web/src/pages/my-routes/active-route/hooks/useGpsTracking.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { getSupabase } from '@transdovic/shared';

// Intervalo entre registros GPS (en milisegundos)
const TRACKING_INTERVAL = 60_000; // 1 minuto

interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
}

/**
 * Hook que registra la ubicación GPS del conductor cada ~1 minuto
 * mientras la ruta esté en progreso.
 * 
 * Usa Capacitor Geolocation cuando está disponible (Android),
 * fallback a navigator.geolocation en web.
 */
export const useGpsTracking = (routeId: string, isActive: boolean) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastPosition, setLastPosition] = useState<GpsPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener posición actual
  const getCurrentPosition = useCallback(async (): Promise<GpsPosition | null> => {
    try {
      // Intentar Capacitor primero
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        };
      }

      // Fallback: navigator.geolocation (web/dev)
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalización no disponible'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
            });
          },
          (err) => reject(new Error(err.message)),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
    } catch (err: any) {
      console.error('[GPS] Error obteniendo posición:', err);
      setError(err.message || 'Error GPS');
      return null;
    }
  }, []);

  // Enviar posición a Supabase
  const sendPosition = useCallback(async () => {
    const position = await getCurrentPosition();
    if (!position) return;

    setLastPosition(position);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error: insertError } = await supabase
        .from('route_trackings')
        .insert({
          route_id: routeId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          speed: position.speed,
          heading: position.heading,
        });

      if (insertError) {
        console.error('[GPS] Error insertando tracking:', insertError);
        setError('Error al enviar ubicación');
      }
    } catch (err: any) {
      console.error('[GPS] Error de red:', err);
      setError('Sin conexión');
    }
  }, [routeId, getCurrentPosition]);

  // Iniciar/detener tracking según isActive
  useEffect(() => {
    if (isActive && routeId) {
      console.log('[GPS] Iniciando tracking para ruta:', routeId);
      setIsTracking(true);

      // Enviar posición inmediatamente
      sendPosition();

      // Luego cada TRACKING_INTERVAL
      intervalRef.current = setInterval(sendPosition, TRACKING_INTERVAL);
    } else {
      // Detener
      if (intervalRef.current) {
        console.log('[GPS] Deteniendo tracking');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, routeId, sendPosition]);

  return {
    lastPosition,
    isTracking,
    error,
    sendPositionNow: sendPosition, // Para forzar envío manual
  };
};