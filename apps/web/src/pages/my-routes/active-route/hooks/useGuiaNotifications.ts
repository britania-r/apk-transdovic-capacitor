// File: apps/web/src/pages/my-routes/active-route/hooks/useGuiaNotifications.ts
import { useEffect, useRef } from 'react';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

/**
 * Se suscribe via Realtime a cambios en waypoint_collections de una ruta.
 * Cuando el admin sube una guía (archivo), notifica al conductor con un toast.
 */
export const useGuiaNotifications = (routeId: string, isActive: boolean) => {
  // Track de archivos ya conocidos para no notificar en carga inicial
  const knownFilesRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !routeId) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel(`guia-notifications-${routeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waypoint_collections',
          filter: `route_id=eq.${routeId}`,
        },
        (payload) => {
          if (!initializedRef.current) {
            initializedRef.current = true;
            return;
          }

          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Detectar si se agregó guía de transportista
          if (newData.guia_transportista_file && !oldData.guia_transportista_file) {
            const key = `gt-${newData.id}`;
            if (!knownFilesRef.current.has(key)) {
              knownFilesRef.current.add(key);
              toast.success('Guía de transportista recibida', {
                icon: '📄',
                duration: 5000,
              });
            }
          }

          // Detectar si se agregó guía de remisión
          if (newData.guia_remision_file && !oldData.guia_remision_file) {
            const key = `gr-${newData.id}`;
            if (!knownFilesRef.current.has(key)) {
              knownFilesRef.current.add(key);
              toast.success('Guía de remisión recibida', {
                icon: '📄',
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    // Marcar como inicializado después de un breve delay
    setTimeout(() => {
      initializedRef.current = true;
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [routeId, isActive]);
};