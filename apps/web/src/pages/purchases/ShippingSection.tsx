// File: apps/web/src/pages/purchases/ShippingSection.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from './SectionShared.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

export const ShippingSection = ({ details }: Props) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    store_pickup: details.store_pickup || false,
    shipping_agency: details.shipping_agency || '',
  });

  useEffect(() => {
    setForm({
      store_pickup: details.store_pickup || false,
      shipping_agency: details.shipping_agency || '',
    });
  }, [details]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update(data)
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Datos de envío actualizados');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleCancel = () => {
    setForm({
      store_pickup: details.store_pickup || false,
      shipping_agency: details.shipping_agency || '',
    });
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className={styles.section}>
      <form onSubmit={handleSubmit}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Datos de envío</h3>
          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn}>
              <i className="bx bx-pencil"></i> Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <div className={styles.checkboxRow}>
                  <input
                    id="store_pickup"
                    type="checkbox"
                    checked={form.store_pickup}
                    onChange={e => setForm(prev => ({ ...prev, store_pickup: e.target.checked }))}
                  />
                  <label htmlFor="store_pickup">Recojo en tienda</label>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Agencia de envío</label>
                <input
                  value={form.shipping_agency}
                  onChange={e => setForm(prev => ({ ...prev, shipping_agency: e.target.value }))}
                  placeholder="Nombre de la agencia"
                  className={styles.fieldInput}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={handleCancel} className={styles.cancelBtn} disabled={updateMutation.isPending}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
                ) : (
                  <><i className="bx bx-save"></i> Guardar</>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Recojo en tienda</span>
              <span className={styles.dataValue}>{details.store_pickup ? 'Sí' : 'No'}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Agencia de envío</span>
              <span className={styles.dataValue}>{details.shipping_agency || '—'}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};