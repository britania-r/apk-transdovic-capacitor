// File: apps/web/src/pages/my-routes/DriverPhotosPage.tsx
import { useCallback } from 'react';
import { useDriverPhotosToday } from './hooks/useDriverPhotosToday';
import { useSignedUrl, getSignedUrl } from '../../hooks/useSignedUrl';
import type { DriverPhotoGroup } from './hooks/useDriverPhotosToday';
import styles from './DriverPhotosPage.module.css';

const BUCKET = 'route-documents';

export const DriverPhotosPage = () => {
  const { data: groups = [], isLoading, error } = useDriverPhotosToday();

  const totalPhotos = groups.reduce(
    (sum, g) => sum + g.stops.reduce((s, st) => s + st.photos.length, 0), 0
  );

  const openPhoto = useCallback(async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) window.open(url, '_blank');
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Fotos del día</h1>
          {totalPhotos > 0 && (
            <span className={styles.count}>{totalPhotos}</span>
          )}
        </div>
        <span className={styles.dateLabel}>
          <i className="bx bx-calendar"></i>
          {new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
        </span>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando fotos...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error al cargar fotos</span>
        </div>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-camera"></i>
          <span>No hay fotos registradas para hoy</span>
          <span className={styles.stateHint}>Las fotos aparecerán al registrar datos en cada tanque</span>
        </div>
      )}

      {/* Grupos */}
      {!isLoading && groups.length > 0 && (
        <div className={styles.groupsList}>
          {groups.map(group => (
            <PhotoRouteGroup key={group.routeId} group={group} onOpenPhoto={openPhoto} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Grupo por ruta ──

interface PhotoRouteGroupProps {
  group: DriverPhotoGroup;
  onOpenPhoto: (path: string) => void;
}

const PhotoRouteGroup = ({ group, onOpenPhoto }: PhotoRouteGroupProps) => {
  return (
    <div className={styles.routeGroup}>
      <div className={styles.routeGroupHeader}>
        <span className={styles.routeGroupSap}>{group.sapRouteId}</span>
        <span className={styles.routeGroupPlate}>{group.plate}</span>
      </div>

      <div className={styles.stopsList}>
        {group.stops.map(stop => (
          <div key={stop.waypointId} className={styles.stopSection}>
            <div className={styles.stopHeader}>
              <span className={styles.stopOrder}>{stop.stopOrder}</span>
              <span className={styles.stopFarm}>{stop.farmName}</span>
              <span className={styles.stopPhotoCount}>
                {stop.photos.length} foto{stop.photos.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className={styles.photosGrid}>
              {stop.photos.map(photo => (
                <PhotoThumb
                  key={photo.id}
                  filePath={photo.photo_file}
                  tankName={photo.tank?.name || 'Tanque'}
                  onOpen={onOpenPhoto}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Thumbnail de foto ──

interface PhotoThumbProps {
  filePath: string;
  tankName: string;
  onOpen: (path: string) => void;
}

const PhotoThumb = ({ filePath, tankName, onOpen }: PhotoThumbProps) => {
  const { data: url, isLoading: loading } = useSignedUrl(filePath);

  return (
    <button
      className={styles.photoThumb}
      onClick={() => onOpen(filePath)}
    >
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