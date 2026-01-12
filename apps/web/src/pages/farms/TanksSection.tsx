// File: apps/web/src/pages/farms/TanksSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './FarmDetailsPage.module.css';
import type { FarmTank } from './FarmDetailsPage';

interface Props {
  farmId: string;
  initialTanks: FarmTank[];
}

export const TanksSection = ({ farmId, initialTanks }: Props) => {
  const [tankToDelete, setTankToDelete] = useState<FarmTank | null>(null);
  const queryClient = useQueryClient();
  
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
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (tankId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('farm_tanks').delete().eq('id', tankId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Tanque eliminado');
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
      setTankToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={`${styles.managersCard} ${styles.tanksSection}`}>
      <header className={styles.managersHeader}>
        <h2>Tanques</h2>
        <button onClick={() => createMutation.mutate()} className={styles.addButton} disabled={createMutation.isPending}>
          <i className='bx bx-plus'></i> {createMutation.isPending ? '...' : 'Agregar'}
        </button>
      </header>
      
      <div className={styles.tanksList}>
        {initialTanks.length > 0 ? initialTanks.map(tank => (
          <div key={tank.id} className={styles.tankItem}>
            <span>{tank.name}</span>
            <button onClick={() => setTankToDelete(tank)} className={`${styles.actionButton} ${styles.deleteButton}`}>
              <i className='bx bx-trash'></i>
            </button>
          </div>
        )) : <p>No hay tanques.</p>}
      </div>

      <ConfirmationModal
        isOpen={!!tankToDelete}
        onClose={() => setTankToDelete(null)}
        onConfirm={() => tankToDelete && deleteMutation.mutate(tankToDelete.id)}
        title="Confirmar Eliminación"
        message={`¿Seguro que quieres eliminar el tanque ${tankToDelete?.name}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};