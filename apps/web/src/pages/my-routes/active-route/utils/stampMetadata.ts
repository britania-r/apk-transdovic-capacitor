// File: apps/web/src/pages/my-routes/active-route/utils/stampMetadata.ts
import type { PhotoMetadata } from '../types';

/**
 * Toma una imagen (File), dibuja los metadatos como overlay
 * en la parte inferior y retorna un nuevo File con la imagen procesada.
 */
export const stampMetadata = async (
  file: File,
  metadata: PhotoMetadata
): Promise<File> => {
  // Cargar imagen en un elemento <img>
  const img = await loadImage(file);

  // Crear canvas con las mismas dimensiones
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // Dibujar la imagen original
  ctx.drawImage(img, 0, 0);

  // Preparar líneas de texto
  const lines = buildLines(metadata);
  const lineCount = lines.length;

  // Configurar fuente proporcional al tamaño de la imagen
  const fontSize = Math.max(14, Math.round(img.width * 0.028));
  const lineHeight = fontSize * 1.4;
  const padding = Math.round(fontSize * 0.7);
  const bannerHeight = lineCount * lineHeight + padding * 2;

  // Dibujar fondo semitransparente en la parte inferior
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

  // Dibujar texto
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textBaseline = 'top';

  const startY = img.height - bannerHeight + padding;
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, startY + i * lineHeight);
  });

  // Convertir canvas a File
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
  const ext = 'jpg';
  const name = `foto-${Date.now()}.${ext}`;
  return new File([blob], name, { type: 'image/jpeg' });
};

/**
 * Construye las líneas de texto a estampar.
 */
const buildLines = (m: PhotoMetadata): string[] => {
  const lines: string[] = [];

  // Línea 1: fecha y hora
  lines.push(`${m.date}  ${m.time}`);

  // Línea 2: placa y conductor
  lines.push(`${m.plate} — ${m.driverName}`);

  // Línea 3: establo/granja
  lines.push(m.farmName);

  // Línea 4: coordenadas (si están disponibles)
  if (m.latitude !== null && m.longitude !== null) {
    lines.push(`GPS: ${m.latitude.toFixed(6)}, ${m.longitude.toFixed(6)}`);
  }

  return lines;
};

/**
 * Carga un File como HTMLImageElement.
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convierte un canvas a Blob.
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Error al generar imagen'));
      },
      type,
      quality
    );
  });
};

/**
 * Obtiene la ubicación actual del dispositivo.
 * Intenta con Capacitor Geolocation primero, fallback a navigator.
 */
export const getCurrentPosition = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    // Intentar con Capacitor
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  } catch {
    // Fallback a navigator (web)
    try {
      return await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    } catch {
      return null;
    }
  }
};