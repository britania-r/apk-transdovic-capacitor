// File: apps/web/src/pages/routes-management/ImportRoutesModal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { useRouteImportData } from './useRouteImportData';
import { processRoutesCSV } from '../../utils/excel-utils';
import type { ParsedRoute } from '../../utils/excel-utils';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './ImportRoutesModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportRoutesModal = ({ isOpen, onClose }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedRoute[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: refData, isLoading: isLoadingRefs } = useRouteImportData();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && refData) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsProcessing(true);

      try {
        const result = await processRoutesCSV(selectedFile, refData);
        const rutasConAdvertencias = result.validRoutes.filter(r => r.warnings.length > 0 && r.errors.length === 0);

        setPreviewData(result.validRoutes);
        setIgnoredCount(result.ignoredRows);

        if (result.validRoutes.length === 0 && result.ignoredRows > 0) {
          toast.error('No se encontraron rutas válidas para tu flota.');
        } else if (rutasConAdvertencias.length > 0) {
          toast.success(
            `Se detectaron ${result.validRoutes.length} rutas (${rutasConAdvertencias.length} con advertencias).`,
            { duration: 5000 }
          );
        } else {
          toast.success(`Se detectaron ${result.validRoutes.length} rutas.`);
        }
      } catch {
        toast.error('Error al leer el archivo CSV. Verifica que fue generado con la macro.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (routesToSave: ParsedRoute[]) => {
      const supabase = getSupabase();
      let savedCount = 0;

      for (const route of routesToSave) {
        const { data: routeDb, error: routeError } = await supabase.from('routes').insert({
          route_date: route.date,
          driver_id: route.driverId || null,
          vehicle_id: route.vehicleId,
          precintos_count: route.precintosCount,
          programed_start_time: route.startTime,
          programed_arrival_time: route.endTime,
          sap_route_id: route.sapRouteId || null,
          status: 'scheduled',
        } as any).select().single();

        if (routeError) throw new Error(`Error guardando ruta ${route.plateInput}: ${routeError.message}`);

        if (routeDb && route.waypoints.length > 0) {
          const waypointsPayload = route.waypoints.map(wp => ({
            route_id: routeDb.id,
            farm_id: wp.farmId,
            stop_order: wp.stopOrder,
            planned_pickup_amount: wp.plannedPickupAmount,
            zone: wp.zone,
            sap_route_id: wp.sapRouteId,
          }));

          const { error: wpError } = await supabase.from('route_waypoints').insert(waypointsPayload as any);
          if (wpError) throw new Error(`Error guardando puntos de ${route.plateInput}: ${wpError.message}`);
        }

        savedCount++;
      }

      return savedCount;
    },
    onSuccess: (count) => {
      toast.success(`${count} rutas importadas exitosamente.`);
      queryClient.invalidateQueries({ queryKey: ['savedRoutes'] });
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    const validRoutes = previewData.filter(r => r.errors.length === 0);
    if (validRoutes.length === 0) return toast.error('No hay rutas válidas para importar.');
    saveMutation.mutate(validRoutes);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setIgnoredCount(0);
    onClose();
  };

  if (!isOpen) return null;

  const validRoutesCount = previewData.filter(r => r.errors.length === 0).length;
  const invalidRoutesCount = previewData.filter(r => r.errors.length > 0).length;
  const warningRoutesCount = previewData.filter(r => r.warnings.length > 0 && r.errors.length === 0).length;

  return (
    <div className={formStyles.overlay} onClick={handleClose}>
      <div className={`${formStyles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bxs-file-import"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Importar Rutas</h3>
              <p className={formStyles.modalSubtitle}>
                Sube el archivo CSV generado por la plantilla Excel
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {!file ? (
            <div className={styles.uploadArea}>
              {isLoadingRefs ? (
                <div className={styles.uploadMessage}>
                  <i className="bx bx-loader-alt bx-spin"></i>
                  <span>Cargando datos del sistema...</span>
                </div>
              ) : (
                <div className={styles.uploadMessage}>
                  <i className="bx bx-cloud-upload"></i>
                  <span>Selecciona el archivo CSV</span>
                  <input type="file" accept=".csv" onChange={handleFileChange} className={styles.fileInput} />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className={styles.summaryBar}>
                <span className={styles.summaryItem}>
                  <i className="bx bx-check-circle" style={{ color: 'var(--color-success)' }}></i>
                  Válidas: <strong>{validRoutesCount}</strong>
                </span>
                {warningRoutesCount > 0 && (
                  <span className={styles.summaryItem}>
                    <i className="bx bx-error" style={{ color: 'var(--color-warning)' }}></i>
                    Advertencias: <strong>{warningRoutesCount}</strong>
                  </span>
                )}
                <span className={styles.summaryItem}>
                  <i className="bx bx-x-circle" style={{ color: 'var(--color-danger)' }}></i>
                  Errores: <strong>{invalidRoutesCount}</strong>
                </span>
                <span className={styles.summaryItem}>
                  <i className="bx bx-skip-next" style={{ color: 'var(--color-text-muted)' }}></i>
                  Ignoradas: <strong>{ignoredCount}</strong>
                </span>
                <button onClick={() => setFile(null)} className={styles.reuploadBtn}>
                  <i className="bx bx-refresh"></i> Cambiar
                </button>
              </div>

              {isProcessing && (
                <div className={styles.processingMsg}>
                  <i className="bx bx-loader-alt bx-spin"></i> Procesando archivo...
                </div>
              )}

              {/* Preview table */}
              <div className={styles.previewWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Fecha</th>
                      <th>Ruta SAP</th>
                      <th>Conductor</th>
                      <th>Placa</th>
                      <th>Puntos</th>
                      <th>Problemas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map(route => {
                      const hasError = route.errors.length > 0;
                      const hasWarning = route.warnings.length > 0 && !hasError;

                      let rowClass = styles.rowValid;
                      if (hasError) rowClass = styles.rowError;
                      else if (hasWarning) rowClass = styles.rowWarning;

                      return (
                        <tr key={route.tempId} className={rowClass}>
                          <td className={styles.statusIcon}>
                            {hasError ? (
                              <i className="bx bx-x-circle" style={{ color: 'var(--color-danger)' }}></i>
                            ) : hasWarning ? (
                              <i className="bx bx-error" style={{ color: 'var(--color-warning)' }}></i>
                            ) : (
                              <i className="bx bx-check-circle" style={{ color: 'var(--color-success)' }}></i>
                            )}
                          </td>
                          <td>{route.date}</td>
                          <td className={styles.monoText}>{route.sapRouteId || '—'}</td>
                          <td>
                            {route.driverId ? (
                              route.driverNameInput
                            ) : (
                              <span className={styles.warningText}>
                                {route.driverNameInput || '(no especificado)'}
                              </span>
                            )}
                          </td>
                          <td className={styles.monoText}>{route.plateInput}</td>
                          <td className={styles.centeredText}>{route.waypoints.length}</td>
                          <td className={styles.problemsCell}>
                            {hasError && route.errors.map((e, i) => (
                              <div key={`err-${i}`} className={styles.errorMsg}>{e}</div>
                            ))}
                            {hasWarning && route.warnings.map((w, i) => (
                              <div key={`warn-${i}`} className={styles.warningMsg}>{w}</div>
                            ))}
                            {!hasError && !hasWarning && '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={formStyles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={formStyles.cancelBtn}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={formStyles.submitBtn}
            disabled={!file || validRoutesCount === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
            ) : (
              <><i className="bx bx-import"></i> Importar {validRoutesCount} rutas</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};