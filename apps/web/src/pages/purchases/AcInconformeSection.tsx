// File: apps/web/src/pages/purchases/AcInconformeSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from './SectionShared.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

export const AcInconformeSection = ({ details }: Props) => {
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState((details as any).ac_inconforme_justification || '');

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update({ ac_inconforme_justification: text } as any)
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Justificación guardada');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      toast.error('Ingresa una justificación');
      return;
    }
    saveMutation.mutate(justification);
  };

  return (
    <div className={styles.section}>
      <form onSubmit={handleSubmit}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Registro de acta inconforme</h3>
        </div>

        <div className={styles.fieldFull}>
          <label className={styles.fieldLabel}>
            Detalla el motivo de la inconformidad
          </label>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            rows={6}
            placeholder="Ej: El producto llegó dañado, la cantidad es incorrecta, el servicio no cumple con lo acordado..."
            className={styles.textarea}
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
            ) : (
              <><i className="bx bx-save"></i> Guardar justificación</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};