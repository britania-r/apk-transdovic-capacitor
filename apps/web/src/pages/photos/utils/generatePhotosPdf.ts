// File: apps/web/src/pages/photos/utils/generatePhotosPdf.ts
import { getSignedUrls } from '../../../hooks/useSignedUrl';
import type { PhotoRoute } from '../hooks/useRoutePhotos';

/**
 * Genera un HTML con todas las fotos de una ruta y lo abre
 * en una nueva pestaña lista para imprimir como PDF.
 */
export const generatePhotosPdf = async (route: PhotoRoute): Promise<void> => {
  // 1. Recopilar todos los photo_file paths
  const allPhotos: {
    path: string;
    tankName: string;
    farmName: string;
    stopOrder: number;
  }[] = [];

  for (const stop of route.stops) {
    for (const photo of stop.photos) {
      allPhotos.push({
        path: photo.photo_file,
        tankName: photo.tankName,
        farmName: stop.farmName,
        stopOrder: stop.stopOrder,
      });
    }
  }

  if (allPhotos.length === 0) return;

  // 2. Generar URLs firmadas en paralelo (con cache)
  const paths = allPhotos.map(p => p.path);
  const urlMap = await getSignedUrls(paths);

  const validPhotos = allPhotos
    .map(p => ({ ...p, url: urlMap.get(p.path) || null }))
    .filter(p => p.url !== null);
  if (validPhotos.length === 0) return;

  // 3. Agrupar por parada para el HTML
  const stopsMap = new Map<number, typeof validPhotos>();
  for (const photo of validPhotos) {
    if (!stopsMap.has(photo.stopOrder)) {
      stopsMap.set(photo.stopOrder, []);
    }
    stopsMap.get(photo.stopOrder)!.push(photo);
  }

  const sortedStops = Array.from(stopsMap.entries()).sort((a, b) => a[0] - b[0]);

  // 4. Construir HTML
  const dateStr = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let stopsHtml = '';
  for (const [stopOrder, photos] of sortedStops) {
    const farmName = photos[0].farmName;

    let photosHtml = '';
    for (const photo of photos) {
      photosHtml += `
        <div class="photo-item">
          <img src="${photo.url}" alt="${photo.tankName}" />
          <div class="photo-label">${photo.tankName}</div>
        </div>
      `;
    }

    stopsHtml += `
      <div class="stop-section">
        <div class="stop-header">
          <span class="stop-order">${stopOrder}</span>
          <span class="stop-farm">${farmName}</span>
        </div>
        <div class="photos-grid">
          ${photosHtml}
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Fotos — ${route.sapRouteId} — ${dateStr}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #1a1a1a;
          background: #fff;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #333;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 800;
        }

        .header-sub {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .header-date {
          font-size: 12px;
          color: #666;
          text-align: right;
        }

        .stop-section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }

        .stop-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding: 6px 10px;
          background: #f0f0f0;
          border-radius: 4px;
        }

        .stop-order {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #333;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        .stop-farm {
          font-size: 13px;
          font-weight: 700;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .photo-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          page-break-inside: avoid;
        }

        .photo-item img {
          width: 100%;
          display: block;
        }

        .photo-label {
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 700;
          background: #f5f5f5;
          text-align: center;
          color: #555;
        }

        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #999;
          text-align: center;
        }

        @media print {
          body { padding: 10px; }
          .stop-section { page-break-inside: avoid; }
          .photo-item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="header-title">Fotos de Recolección — ${route.sapRouteId}</div>
          <div class="header-sub">${route.driverName} · ${route.plate}</div>
        </div>
        <div class="header-date">
          Fecha: ${dateStr}<br/>
          Total: ${validPhotos.length} foto${validPhotos.length !== 1 ? 's' : ''}
        </div>
      </div>

      ${stopsHtml}

      <div class="footer">
        Generado el ${new Date().toLocaleString('es-PE')} — TransDovic
      </div>
    </body>
    </html>
  `;

  // 5. Abrir en nueva pestaña y lanzar impresión cuando carguen las imágenes
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();

    // Esperar a que todas las imágenes carguen, luego abrir diálogo de impresión
    const images = newWindow.document.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;

    const checkReady = () => {
      loaded++;
      if (loaded >= total) {
        setTimeout(() => newWindow.print(), 300);
      }
    };

    if (total === 0) {
      setTimeout(() => newWindow.print(), 300);
    } else {
      images.forEach(img => {
        if (img.complete) {
          checkReady();
        } else {
          img.addEventListener('load', checkReady);
          img.addEventListener('error', checkReady);
        }
      });
    }
  }
};