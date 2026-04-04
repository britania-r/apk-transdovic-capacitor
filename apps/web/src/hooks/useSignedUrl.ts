// File: apps/web/src/hooks/useSignedUrl.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';

const DEFAULT_BUCKET = 'route-documents';
const URL_EXPIRY = 60 * 60; // 1 hora
const CACHE_TIME = 1000 * 60 * 50; // 50 min (antes de que expire la URL)

/**
 * Hook que cachea URLs firmadas de Supabase Storage.
 * React Query se encarga de no volver a pedir la misma URL
 * mientras esté en cache (50 min).
 */
export const useSignedUrl = (
  filePath: string | null | undefined,
  bucket: string = DEFAULT_BUCKET
) => {
  return useQuery<string | null>({
    queryKey: ['signedUrl', bucket, filePath],
    queryFn: async () => {
      if (!filePath) return null;
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, URL_EXPIRY);
      return data?.signedUrl ?? null;
    },
    enabled: !!filePath,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME, // mantener en cache aunque no esté montado
    retry: 1,
  });
};

/**
 * Función standalone para obtener URL firmada (para uso fuera de componentes).
 * Usa un cache en memoria simple.
 */
const urlCache = new Map<string, { url: string; expiresAt: number }>();

export const getSignedUrl = async (
  filePath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<string | null> => {
  const cacheKey = `${bucket}:${filePath}`;
  const cached = urlCache.get(cacheKey);

  // Si existe en cache y no expiró (con 5 min de margen)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.url;
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, URL_EXPIRY);

    if (data?.signedUrl) {
      urlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + URL_EXPIRY * 1000,
      });
      return data.signedUrl;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Obtener múltiples URLs firmadas en paralelo con cache.
 */
export const getSignedUrls = async (
  filePaths: string[],
  bucket: string = DEFAULT_BUCKET
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();

  await Promise.all(
    filePaths.map(async (path) => {
      const url = await getSignedUrl(path, bucket);
      if (url) results.set(path, url);
    })
  );

  return results;
};