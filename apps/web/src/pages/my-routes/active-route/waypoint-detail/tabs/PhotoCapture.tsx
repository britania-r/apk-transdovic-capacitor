// File: apps/web/src/pages/my-routes/active-route/waypoint-detail/tabs/PhotoCapture.tsx
import { useState, useRef, useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { stampMetadata, getCurrentPosition } from '../../utils/stampMetadata';
import type { PhotoMetadata } from '../../types';
import styles from '../WaypointDetailPage.module.css';

const BUCKET = 'route-documents';

interface Props {
  /** Path de foto ya subida (si existe) */
  existingPhoto: string | null;
  /** Info para construir el path de storage */
  routeId: string;
  waypointId: string;
  tankId: string;
  /** Info para estampar en la foto */
  plate: string;
  driverName: string;
  farmName: string;
  /** Callback con el path del archivo subido */
  onPhotoUploaded: (filePath: string) => void;
  /** Callback para eliminar foto */
  onPhotoRemoved: () => void;
  /** Deshabilitar */
  disabled: boolean;
}

export const PhotoCapture = ({
  existingPhoto,
  routeId,
  waypointId,
  tankId,
  plate,
  driverName,
  farmName,
  onPhotoUploaded,
  onPhotoRemoved,
  disabled,
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generar URL firmada para foto existente
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadExistingPhoto = useCallback(async () => {
    if (!existingPhoto || signedUrl) return;
    setLoadingPreview(true);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(existingPhoto, 60 * 60);
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    } catch {
      // silenciar
    } finally {
      setLoadingPreview(false);
    }
  }, [existingPhoto, signedUrl]);

  // Cargar preview si hay foto existente
  if (existingPhoto && !signedUrl && !loadingPreview) {
    loadExistingPhoto();
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetear input para permitir re-selección del mismo archivo
    e.target.value = '';

    setIsUploading(true);
    setError(null);

    try {
      // 1. Obtener ubicación
      const position = await getCurrentPosition();

      // 2. Construir metadatos
      const now = new Date();
      const metadata: PhotoMetadata = {
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        date: now.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        time: now.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        plate,
        driverName,
        farmName,
      };

      // 3. Estampar metadatos en la imagen
      const stampedFile = await stampMetadata(file, metadata);

      // 4. Mostrar preview local
      const localUrl = URL.createObjectURL(stampedFile);
      setPreviewUrl(localUrl);

      // 5. Subir a Storage
      const timestamp = Date.now();
      const path = `routes/${routeId}/${waypointId}/tank-${tankId}-${timestamp}.jpg`;

      const supabase = getSupabase();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, stampedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      // 6. Notificar path al padre
      onPhotoUploaded(path);
      toast.success('Foto subida correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la foto');
      setPreviewUrl(null);
      toast.error('Error al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSignedUrl(null);
    setError(null);
    onPhotoRemoved();
  };

  // Determinar qué mostrar
  const displayUrl = previewUrl || signedUrl;
  const hasPhoto = !!existingPhoto || !!previewUrl;

  return (
    <div className={styles.formSection}>
      <h3 className={styles.formSectionTitle}>
        <i className="bx bx-camera" style={{ color: 'var(--color-primary)' }}></i> Foto
      </h3>

      {isUploading ? (
        <div className={styles.photoUploading}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Procesando y subiendo foto...</span>
        </div>
      ) : hasPhoto && displayUrl ? (
        <div className={styles.photoPreview}>
          <img src={displayUrl} alt="Foto del tanque" />
          {!disabled && (
            <button
              onClick={handleRemove}
              className={styles.photoRemoveBtn}
              type="button"
            >
              <i className="bx bx-x"></i>
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className={styles.fileInputHidden}
            disabled={disabled}
          />
          <label
            onClick={() => inputRef.current?.click()}
            className={styles.photoUploadLabel}
          >
            <i className="bx bx-camera"></i>
            Tomar foto
          </label>
        </>
      )}

      {error && (
        <div className={styles.photoError}>
          <i className="bx bx-error-circle"></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};