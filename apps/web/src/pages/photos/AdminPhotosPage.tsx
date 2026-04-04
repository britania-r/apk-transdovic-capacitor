// File: apps/web/src/pages/photos/AdminPhotosPage.tsx
import { useState, useCallback } from 'react';
import { useRoutePhotos } from './hooks/useRoutePhotos';
import { generatePhotosPdf } from './utils/generatePhotosPdf';
import { useSignedUrl, getSignedUrl } from '../../hooks/useSignedUrl';
import type { PhotoRoute, PhotoStop } from './hooks/useRoutePhotos';
import styles from './AdminPhotosPage.module.css';
import pageStyles from '../users/UsersPage.module.css';

const BUCKET = 'route-documents';

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const AdminPhotosPage = () => {
  const [dateFilter, setDateFilter] = useState(getToday());
  const [search, setSearch] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const { data: routes = [], isLoading, error } = useRoutePhotos(dateFilter);

  // Filtrar por búsqueda
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

  const hasActiveFilters = !!search || dateFilter !== getToday();

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <div className={styles.headerRow}>
          {/* Título */}
          <div className={pageStyles.headerTitle}>
            <h1 className={pageStyles.title}>Imágenes</h1>
            <span className={pageStyles.count}>{totalPhotos}</span>
          </div>

          {/* Buscador */}
          <div className={`${pageStyles.searchBar} ${styles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar por ruta, conductor, placa, granja..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={pageStyles.searchInput}
            />
            {search && (
              <button className={pageStyles.searchClear} onClick={() => setSearch('')}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          {/* Filtro fecha */}
          <div className={styles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* Estados */}
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
            {hasActiveFilters
              ? 'Sin resultados para los filtros aplicados'
              : 'No hay fotos registradas para esta fecha'}
          </span>
        </div>
      )}

      {/* Rutas con fotos */}
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
    </div>
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

interface StopPhotoSectionProps {
  stop: PhotoStop;
  onOpenPhoto: (path: string) => void;
}

const StopPhotoSection = ({ stop, onOpenPhoto }: StopPhotoSectionProps) => {
  return (
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
};

// ── Thumbnail ──

interface PhotoThumbProps {
  filePath: string;
  tankName: string;
  onOpen: (path: string) => void;
}

const PhotoThumb = ({ filePath, tankName, onOpen }: PhotoThumbProps) => {
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