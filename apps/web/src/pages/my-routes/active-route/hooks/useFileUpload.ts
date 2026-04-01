// File: apps/web/src/pages/my-routes/active-route/hooks/useFileUpload.ts
import { useState, useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';

const BUCKET = 'route-documents';

interface UploadResult {
  path: string;
  url: string;
}

/**
 * Hook para subir archivos de guías al bucket de Storage.
 * Genera paths organizados: routes/{routeId}/{waypointId}/{filename}
 */
export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File,
    routeId: string,
    waypointId: string,
    prefix: 'guia-transportista' | 'guia-remision'
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const ext = file.name.split('.').pop() || 'pdf';
      const timestamp = Date.now();
      const path = `routes/${routeId}/${waypointId}/${prefix}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      // Obtener URL firmada (válida 1 año)
      const { data: urlData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      return {
        path,
        url: urlData?.signedUrl || '',
      };
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      setError(err.message || 'Error al subir archivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Obtener URL firmada de un archivo existente
  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24); // 24 horas
      return data?.signedUrl || null;
    } catch {
      return null;
    }
  }, []);

  return {
    upload,
    getSignedUrl,
    isUploading,
    error,
  };
};