// File: apps/web/src/pages/routes-management/PhotosContent.tsx
import { useState, useCallback, useEffect } from 'react';
import { useRoutePhotos } from '../photos/hooks/useRoutePhotos';
import { generatePhotosPdf } from '../photos/utils/generatePhotosPdf';
import { useSignedUrl, getSignedUrl } from '../../hooks/useSignedUrl';
import type { PhotoRoute, PhotoStop } from '../photos/hooks/useRoutePhotos';
import styles from '../photos/AdminPhotosPage.module.css';
import pageStyles from '../users/UsersPage.module.css';

interface PhotosContentProps {
  dateFilter: string;
  search: string;
  onCountChange: (count: number) => void;
}

export const PhotosContent = ({ dateFilter, search, onCountChange }: PhotosContentProps) => {
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const { data: routes = [], isLoading, error } = useRoutePhotos(dateFilter);

  const filteredRoutes = search.trim()
    ? routes.filter(r => {
        const q = search.toLowerCase();
        return (
          r.sapRouteId.toLowerCase().includes(q) ||
          r.driverName.toLowerCase().includes(q) ||
          r.plate.toLowerCase().includes(q) ||
          r.stops.some(s => s.farmName.toLowerCase().includes(q))
        );
      })
    : routes;

  const totalPhotos = filteredRoutes.reduce((sum, r) => sum + r.totalPhotos, 0);

  // Sincronizar contador
  useEffect(() => {
    onCountChange(totalPhotos);
  }, [totalPhotos, onCountChange]);

  const openPhoto = useCallback(async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) window.open(url, '_blank');
  }, []);

  const handleGeneratePdf = async (route: PhotoRoute) => {
    setGeneratingPdf(route.routeId);
    try {
      await generatePhotosPdf(route);
    } catch {
      // silenciar
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando imágenes...</span>
        </div>
      )}

      {error && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error al cargar imágenes</span>
        </div>
      )}

      {!isLoading && !error && filteredRoutes.length === 0 && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-camera"></i>
          <span>
            {search
              ? 'Sin resultados para la búsqueda'
              : 'No hay fotos registradas para esta fecha'}
          </span>
        </div>
      )}

      {!isLoading && filteredRoutes.length > 0 && (
        <div className={styles.routesList}>
          {filteredRoutes.map(route => (
            <RoutePhotoGroup
              key={route.routeId}
              route={route}
              onOpenPhoto={openPhoto}
              onGeneratePdf={() => handleGeneratePdf(route)}
              isGenerating={generatingPdf === route.routeId}
            />
          ))}
        </div>
      )}
    </>
  );
};

// ── Grupo por ruta ──

interface RoutePhotoGroupProps {
  route: PhotoRoute;
  onOpenPhoto: (path: string) => void;
  onGeneratePdf: () => void;
  isGenerating: boolean;
}

const RoutePhotoGroup = ({ route, onOpenPhoto, onGeneratePdf, isGenerating }: RoutePhotoGroupProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.routeGroup}>
      <div className={styles.routeGroupHeader}>
        <button
          className={styles.routeGroupToggle}
          onClick={() => setExpanded(!expanded)}
        >
          <i className={`bx ${expanded ? 'bx-chevron-down' : 'bx-chevron-right'}`}></i>
        </button>

        <div className={styles.routeGroupInfo}>
          <span className={styles.routeGroupSap}>{route.sapRouteId}</span>
          <span className={styles.routeGroupMeta}>
            {route.driverName} · {route.plate}
          </span>
        </div>

        <span className={styles.routeGroupCount}>
          {route.totalPhotos} foto{route.totalPhotos !== 1 ? 's' : ''}
        </span>

        <button
          onClick={onGeneratePdf}
          disabled={isGenerating}
          className={styles.pdfBtn}
          title="Generar PDF con fotos"
        >
          {isGenerating ? (
            <i className="bx bx-loader-alt bx-spin"></i>
          ) : (
            <i className="bx bx-file-blank"></i>
          )}
          PDF
        </button>
      </div>

      {expanded && (
        <div className={styles.stopsList}>
          {route.stops.map(stop => (
            <StopPhotoSection key={stop.waypointId} stop={stop} onOpenPhoto={onOpenPhoto} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sección por parada ──

const StopPhotoSection = ({ stop, onOpenPhoto }: { stop: PhotoStop; onOpenPhoto: (path: string) => void }) => (
  <div className={styles.stopSection}>
    <div className={styles.stopHeader}>
      <span className={styles.stopOrder}>{stop.stopOrder}</span>
      <span className={styles.stopFarm}>{stop.farmName}</span>
      <span className={styles.stopRuc}>{stop.farmRuc}</span>
    </div>
    <div className={styles.photosGrid}>
      {stop.photos.map(photo => (
        <PhotoThumb
          key={photo.id}
          filePath={photo.photo_file}
          tankName={photo.tankName}
          onOpen={onOpenPhoto}
        />
      ))}
    </div>
  </div>
);

// ── Thumbnail ──

const PhotoThumb = ({ filePath, tankName, onOpen }: { filePath: string; tankName: string; onOpen: (path: string) => void }) => {
  const { data: url, isLoading: loading } = useSignedUrl(filePath);

  return (
    <button className={styles.photoThumb} onClick={() => onOpen(filePath)}>
      {loading ? (
        <div className={styles.photoThumbLoading}>
          <i className="bx bx-loader-alt bx-spin"></i>
        </div>
      ) : url ? (
        <img src={url} alt={tankName} />
      ) : (
        <div className={styles.photoThumbError}>
          <i className="bx bx-error"></i>
        </div>
      )}
      <span className={styles.photoThumbLabel}>{tankName}</span>
    </button>
  );
};