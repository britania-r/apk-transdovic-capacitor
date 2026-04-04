// File: apps/web/src/pages/my-routes/DriverGuidesPage.tsx
import { useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';
import { useDriverGuidesToday } from './hooks/useDriverGuidesToday';
import type { DriverGuideRoute, DriverGuideEntry } from './hooks/useDriverGuidesToday';
import styles from './DriverGuidesPage.module.css';

const BUCKET = 'route-documents';

export const DriverGuidesPage = () => {
  const { data: groups = [], isLoading, error } = useDriverGuidesToday();

  const openFile = useCallback(async (filePath: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      // silenciar
    }
  }, []);

  const totalGuias = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Guías del día</h1>
          {totalGuias > 0 && (
            <span className={styles.count}>{totalGuias}</span>
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
          <span>Cargando guías...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error al cargar guías</span>
        </div>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-file"></i>
          <span>No hay guías registradas para hoy</span>
          <span className={styles.stateHint}>Las guías aparecerán cuando el administrador las asigne</span>
        </div>
      )}

      {/* Grupos por ruta */}
      {!isLoading && groups.length > 0 && (
        <div className={styles.groupsList}>
          {groups.map(group => (
            <RouteGuideGroup key={group.routeId} group={group} onOpenFile={openFile} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Componente interno: grupo por ruta ──

interface RouteGuideGroupProps {
  group: DriverGuideRoute;
  onOpenFile: (path: string) => void;
}

const RouteGuideGroup = ({ group, onOpenFile }: RouteGuideGroupProps) => {
  return (
    <div className={styles.routeGroup}>
      <div className={styles.routeGroupHeader}>
        <span className={styles.routeGroupSap}>{group.sapRouteId}</span>
        <span className={styles.routeGroupPlate}>{group.plate}</span>
      </div>

      <div className={styles.entriesList}>
        {group.entries.map(entry => (
          <GuideEntryCard key={entry.id} entry={entry} onOpenFile={onOpenFile} />
        ))}
      </div>
    </div>
  );
};

// ── Componente interno: tarjeta de guía ──

interface GuideEntryCardProps {
  entry: DriverGuideEntry;
  onOpenFile: (path: string) => void;
}

const GuideEntryCard = ({ entry, onOpenFile }: GuideEntryCardProps) => {
  const farmName = entry.waypoint?.farm?.name || 'Granja';
  const stopOrder = entry.waypoint?.stop_order ?? '—';
  const hasTransportista = !!entry.guia_transportista_file;
  const hasRemision = !!entry.guia_remision_file;

  return (
    <div className={styles.entryCard}>
      {/* Info de la parada */}
      <div className={styles.entryHeader}>
        <span className={styles.entryOrder}>{stopOrder}</span>
        <div className={styles.entryInfo}>
          <span className={styles.entryFarm}>{farmName}</span>
          <span className={styles.entryRuc}>{entry.waypoint?.farm?.ruc || '—'}</span>
        </div>
      </div>

      {/* Números de guía */}
      <div className={styles.entryNumbers}>
        <div className={styles.entryNumber}>
          <span className={styles.entryNumberLabel}>G. Transportista</span>
          <span className={styles.entryNumberValue}>
            {entry.guia_transportista_number || 'Sin asignar'}
          </span>
        </div>
        <div className={styles.entryNumber}>
          <span className={styles.entryNumberLabel}>G. Remisión</span>
          <span className={styles.entryNumberValue}>
            {entry.guia_remision_number || 'Sin asignar'}
          </span>
        </div>
      </div>

      {/* Precintos */}
      {(entry.precinto_ingreso || entry.precinto_salida) && (
        <div className={styles.entryPrecintos}>
          <i className="bx bx-lock-alt"></i>
          <span>{entry.precinto_ingreso || '—'} / {entry.precinto_salida || '—'}</span>
        </div>
      )}

      {/* Documentos */}
      <div className={styles.entryDocs}>
        {hasTransportista ? (
          <button
            onClick={() => onOpenFile(entry.guia_transportista_file!)}
            className={styles.docBtnSuccess}
          >
            <i className="bx bx-file"></i> Ver GT
          </button>
        ) : (
          <span className={styles.docPending}>
            <i className="bx bx-time"></i> GT pendiente
          </span>
        )}
        {hasRemision ? (
          <button
            onClick={() => onOpenFile(entry.guia_remision_file!)}
            className={styles.docBtnSuccess}
          >
            <i className="bx bx-file"></i> Ver GR
          </button>
        ) : (
          <span className={styles.docPending}>
            <i className="bx bx-time"></i> GR pendiente
          </span>
        )}
      </div>
    </div>
  );
};