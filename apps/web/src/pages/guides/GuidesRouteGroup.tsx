// File: apps/web/src/pages/guides/GuidesRouteGroup.tsx
import { useCallback } from 'react';
import { getSupabase } from '@transdovic/shared';
import type { GuidesByRoute } from './hooks/useGuidesByDate';
import localStyles from './GuidesPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';

interface Props {
  group: GuidesByRoute;
}

const BUCKET = 'route-documents';

export const GuidesRouteGroup = ({ group }: Props) => {
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

  return (
    <div className={localStyles.routeGroup}>
      {/* Header del grupo */}
      <div className={localStyles.routeGroupHeader}>
        <div className={localStyles.routeGroupInfo}>
          <span className={localStyles.routeGroupSap}>{group.sapRouteId}</span>
          <span className={localStyles.routeGroupMeta}>
            {group.driverName} · {group.plate} · Salida: {group.startTime}
          </span>
        </div>
        <span className={localStyles.routeGroupCount}>
          {group.entries.length} guía{group.entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla de guías */}
      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Granja</th>
              <th>N° G. Transportista</th>
              <th>N° G. Remisión</th>
              <th>Precintos</th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {group.entries.map(entry => {
              const farmName = entry.waypoint?.farm?.name || '—';
              const stopOrder = entry.waypoint?.stop_order || '—';

              return (
                <tr key={entry.id}>
                  <td className={localStyles.orderCell}>{stopOrder}</td>
                  <td>
                    <div className={tableStyles.userCell}>
                      <div className={tableStyles.userInfo}>
                        <span className={tableStyles.userName}>{farmName}</span>
                        <span className={tableStyles.userEmail}>{entry.waypoint?.farm?.ruc || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className={localStyles.guiaNumCell}>
                    {entry.guia_transportista_number || '—'}
                  </td>
                  <td className={localStyles.guiaNumCell}>
                    {entry.guia_remision_number || '—'}
                  </td>
                  <td className={localStyles.precintosCell}>
                    {entry.precinto_ingreso || entry.precinto_salida ? (
                      <span>{entry.precinto_ingreso || '—'} / {entry.precinto_salida || '—'}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className={localStyles.docsCell}>
                      {entry.guia_transportista_file ? (
                        <button
                          onClick={() => openFile(entry.guia_transportista_file!)}
                          className={localStyles.docBtn}
                          title="Ver guía transportista"
                        >
                          <i className="bx bx-file"></i> GT
                        </button>
                      ) : (
                        <span className={localStyles.docPending}>GT</span>
                      )}
                      {entry.guia_remision_file ? (
                        <button
                          onClick={() => openFile(entry.guia_remision_file!)}
                          className={localStyles.docBtn}
                          title="Ver guía remisión"
                        >
                          <i className="bx bx-file"></i> GR
                        </button>
                      ) : (
                        <span className={localStyles.docPending}>GR</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};