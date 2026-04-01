// File: apps/web/src/pages/farms/TanksSection.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { ImportConversionModal } from './ImportConversionModal';
import styles from './FarmDetailsPage.module.css';
import own from './TanksSection.module.css';
import type { FarmTank } from './FarmDetailsPage';

interface Props {
  farmId: string;
  initialTanks: FarmTank[];
}

interface ConversionSummary {
  tank_id: string;
  type: string;
  count: number;
}

export const TanksSection = ({ farmId, initialTanks }: Props) => {
  const [tankToDelete, setTankToDelete] = useState<FarmTank | null>(null);
  const [tankToImport, setTankToImport] = useState<FarmTank | null>(null);
  const [tankToClear, setTankToClear] = useState<FarmTank | null>(null);
  const queryClient = useQueryClient();

  // Obtener resumen de conversiones por tanque
  const { data: conversionSummaries = [] } = useQuery<ConversionSummary[]>({
    queryKey: ['tank_conversions_summary', farmId],
    queryFn: async () => {
      const supabase = getSupabase();
      const tankIds = initialTanks.map(t => t.id);
      if (tankIds.length === 0) return [];

      const { data, error } = await supabase
        .from('tank_conversions')
        .select('tank_id, type')
        .in('tank_id', tankIds);
      if (error) throw new Error(error.message);

      // Agrupar por tank_id
      const map = new Map<string, { type: string; count: number }>();
      (data || []).forEach(row => {
        const existing = map.get(row.tank_id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(row.tank_id, { type: row.type, count: 1 });
        }
      });

      return Array.from(map.entries()).map(([tank_id, info]) => ({
        tank_id,
        type: info.type,
        count: info.count,
      }));
    },
    enabled: initialTanks.length > 0,
  });

  const getConversionInfo = (tankId: string) =>
    conversionSummaries.find(s => s.tank_id === tankId) || null;

  // Crear tanque
  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const newTankName = `TQ ${initialTanks.length + 1}`;
      const { error } = await supabase.from('farm_tanks').insert({ farm_id: farmId, name: newTankName });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Tanque agregado');
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  // Eliminar tanque (cascade eliminará sus conversiones)
  const deleteMutation = useMutation({
    mutationFn: async (tankId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('farm_tanks').delete().eq('id', tankId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Tanque eliminado');
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
      queryClient.invalidateQueries({ queryKey: ['tank_conversions_summary', farmId] });
      setTankToDelete(null);
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  // Limpiar tabla de conversión
  const clearMutation = useMutation({
    mutationFn: async (tankId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('tank_conversions').delete().eq('tank_id', tankId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Tabla de conversión eliminada');
      queryClient.invalidateQueries({ queryKey: ['tank_conversions_summary', farmId] });
      setTankToClear(null);
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Tanques</h3>
        <button
          onClick={() => createMutation.mutate()}
          className={styles.sectionAddBtn}
          disabled={createMutation.isPending}
        >
          <i className="bx bx-plus"></i>
          {createMutation.isPending ? 'Agregando...' : 'Agregar tanque'}
        </button>
      </div>

      {initialTanks.length === 0 ? (
        <p className={styles.sectionEmpty}>No hay tanques registrados</p>
      ) : (
        <div>
          {initialTanks.map(tank => {
            const conv = getConversionInfo(tank.id);
            return (
              <div key={tank.id} className={own.tankItem}>
                {/* Info del tanque */}
                <div className={own.tankLeft}>
                  <span className={own.tankName}>
                    <i className="bx bx-cylinder"></i>
                    {tank.name}
                  </span>

                  {/* Badge de tabla de conversión */}
                  {conv ? (
                    <span className={own.convBadge}>
                      <i className="bx bx-table"></i>
                      {conv.type === 'decimal' ? 'Decimal' : 'Entero'} · {conv.count} filas
                    </span>
                  ) : (
                    <span className={own.convBadgeEmpty}>
                      <i className="bx bx-minus-circle"></i>
                      Sin tabla
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className={own.tankActions}>
                  <button
                    onClick={() => setTankToImport(tank)}
                    className={`${own.tankActionBtn} ${own.importBtn}`}
                    title={conv ? 'Reimportar tabla' : 'Importar tabla'}
                  >
                    <i className="bx bx-import"></i>
                  </button>

                  {conv && (
                    <button
                      onClick={() => setTankToClear(tank)}
                      className={`${own.tankActionBtn} ${own.clearBtn}`}
                      title="Limpiar tabla"
                    >
                      <i className="bx bx-eraser"></i>
                    </button>
                  )}

                  <button
                    onClick={() => setTankToDelete(tank)}
                    className={`${styles.miniActionBtn} ${styles.miniDeleteBtn}`}
                    title="Eliminar tanque"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal importar */}
      {tankToImport && (
        <ImportConversionModal
          isOpen={!!tankToImport}
          onClose={() => setTankToImport(null)}
          tankId={tankToImport.id}
          tankName={tankToImport.name}
          farmId={farmId}
        />
      )}

      {/* Modal confirmar eliminar tanque */}
      <ConfirmationModal
        isOpen={!!tankToDelete}
        onClose={() => setTankToDelete(null)}
        onConfirm={() => tankToDelete && deleteMutation.mutate(tankToDelete.id)}
        title="Eliminar tanque"
        message={`¿Estás seguro de eliminar el tanque "${tankToDelete?.name}"? Se eliminará también su tabla de conversión si existe.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* Modal confirmar limpiar tabla */}
      <ConfirmationModal
        isOpen={!!tankToClear}
        onClose={() => setTankToClear(null)}
        onConfirm={() => tankToClear && clearMutation.mutate(tankToClear.id)}
        title="Limpiar tabla de conversión"
        message={`¿Estás seguro de eliminar toda la tabla de conversión del tanque "${tankToClear?.name}"? Podrás importar una nueva después.`}
        confirmText="Sí, limpiar"
        isLoading={clearMutation.isPending}
        variant="warning"
      />
    </div>
  );
};