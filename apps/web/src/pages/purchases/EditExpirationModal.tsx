// File: apps/web/src/pages/purchases/EditExpirationModal.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderItem } from './PurchasesDetailsPage';
import formStyles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: PurchaseOrderItem | null;
  orderId: string;
}

const getItemLabel = (item: PurchaseOrderItem): string => {
  if (item.first_aid_item_name) return item.first_aid_item_name;
  if (item.manual_code) return `Extintor: ${item.manual_code}`;
  if (item.vehicle_plate) return `Vehículo: ${item.vehicle_plate}`;
  return 'Ítem';
};

export const EditExpirationModal = ({ isOpen, onClose, item, orderId }: Props) => {
  const [date, setDate] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item && isOpen) {
      setDate(item.expiration_date || '');
    }
  }, [item, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (newDate: string) => {
      const { error } = await getSupabase()
        .from('purchase_order_items')
        .update({ expiration_date: newDate })
        .eq('id', item!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fecha de vencimiento actualizada');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['expiring_items'] });
      onClose();
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error('Selecciona una fecha');
      return;
    }
    updateMutation.mutate(date);
  };

  if (!isOpen || !item) return null;

  const subtitle = [
    getItemLabel(item),
    item.vehicle_plate ? `• ${item.vehicle_plate}` : '',
  ].filter(Boolean).join(' ');

  const formatCurrentDate = (d: string | null) => {
    if (!d) return 'Sin fecha asignada';
    const [y, m, day] = d.split('-');
    return `Actual: ${day}/${m}/${y}`;
  };

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={formStyles.modal} onClick={e => e.stopPropagation()}>

        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-calendar-edit"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Editar vencimiento</h3>
              <p className={formStyles.modalSubtitle}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Fecha de vencimiento <span className={formStyles.required}>*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                autoFocus
                className={formStyles.input}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {formatCurrentDate(item.expiration_date)}
              </span>
            </div>
          </div>

          <div className={formStyles.modalFooter}>
            <button type="button" onClick={onClose} className={formStyles.cancelBtn} disabled={updateMutation.isPending}>
              Cancelar
            </button>
            <button type="submit" className={formStyles.submitBtn} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-save"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};