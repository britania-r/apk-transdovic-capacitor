// File: apps/web/src/pages/purchases/ShippingSection.tsx

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from '../users/UserFormModal.module.css';
import pageStyles from './PurchasesDetailsPage.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

export const ShippingSection = ({ details }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    store_pickup: details.store_pickup || false,
    shipping_agency: details.shipping_agency || '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData({
      store_pickup: details.store_pickup || false,
      shipping_agency: details.shipping_agency || '',
    });
  }, [details]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update(updatedData)
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Datos de envío actualizados.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
    },
    onError: (error: Error) => toast.error(`Error al actualizar: ${error.message}`),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  const handleCancel = () => {
    setFormData({
      store_pickup: details.store_pickup || false,
      shipping_agency: details.shipping_agency || '',
    });
    setIsEditing(false);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSave}>
        <div className={pageStyles.cardHeader} style={{padding: '0 0 1rem 0', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0}}>Datos de Envío</h2>
          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} className="button-secondary">Editar</button>
          )}
        </div>

        <div className={styles.form} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="store_pickup_checkbox" style={{cursor: 'pointer'}}>¿Recojo en Tienda?</label>
            {isEditing ? (
              <input 
                id="store_pickup_checkbox"
                type="checkbox" 
                name="store_pickup" 
                checked={formData.store_pickup} 
                onChange={handleChange}
                style={{ width: '20px', height: '20px' }}
              />
            ) : (
              <p className={pageStyles.value}>{details.store_pickup ? 'Sí' : 'No'}</p>
            )}
          </div>
          
          <div className={styles.inputGroup}>
            <label>Agencia de Envío</label>
            {isEditing ? (
              <input name="shipping_agency" value={formData.shipping_agency} onChange={handleChange} placeholder="Nombre de la agencia" />
            ) : (
              <p className={pageStyles.value}>{details.shipping_agency || '-'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton} disabled={updateMutation.isPending}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};