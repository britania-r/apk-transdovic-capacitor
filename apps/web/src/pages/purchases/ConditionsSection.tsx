// File: apps/web/src/pages/purchases/ConditionsSection.tsx

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from '../users/UserFormModal.module.css';
import pageStyles from './PurchasesDetailsPage.module.css';

// Importamos el tipo para las cuentas bancarias
import type { BankAccount } from './PurchasesDetailsPage';

interface Props {
  details: PurchaseOrderDetails;
}

// Definimos un tipo para el estado del formulario
type ConditionsFormData = {
  currency: string | null;
  payment_condition: string | null;
  credit_days: number | null;
  supplier_bank_account_id: string | null;
};

export const ConditionsSection = ({ details }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ConditionsFormData>({
    currency: details.currency || 'PEN',
    payment_condition: details.payment_condition || 'Al Contado',
    credit_days: details.credit_days || 0,
    supplier_bank_account_id: details.supplier_bank_account_id || '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData({
      currency: details.currency || 'PEN',
      payment_condition: details.payment_condition || 'Al Contado',
      credit_days: details.credit_days || 0,
      supplier_bank_account_id: details.supplier_bank_account_id || '',
    });
  }, [details]);

  const updateMutation = useMutation({
    // --- CORRECCIÓN DE TYPESCRIPT ---
    mutationFn: async (updatedData: ConditionsFormData) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update(updatedData)
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Condiciones de compra actualizadas.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['credit_days'].includes(name);
    
    if (name === 'payment_condition' && value === 'Al Contado') {
      setFormData(prev => ({ ...prev, payment_condition: value, credit_days: 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      currency: details.currency || 'PEN',
      payment_condition: details.payment_condition || 'Al Contado',
      credit_days: details.credit_days || 0,
      supplier_bank_account_id: details.supplier_bank_account_id || '',
    });
    setIsEditing(false);
  };
  
  const canEdit = !!details.supplier;

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSave}>
        <div className={pageStyles.cardHeader} style={{padding: '0 0 1rem 0', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0}}>Condiciones de Compra</h2>
          {!isEditing && canEdit && (
            <button type="button" onClick={() => setIsEditing(true)} className="button-secondary">Editar</button>
          )}
        </div>

        <div className={styles.form} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className={styles.inputGroup}>
            <label>Moneda</label>
            {isEditing ? (
              <select name="currency" value={formData.currency || 'PEN'} onChange={handleChange} disabled={!isEditing}>
                <option value="PEN">Soles (S/)</option>
                <option value="USD">Dólares ($)</option>
              </select>
            ) : (
              <p className={pageStyles.value}>{details.currency || '-'}</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Condición de Pago</label>
            {isEditing ? (
              <select name="payment_condition" value={formData.payment_condition || 'Al Contado'} onChange={handleChange} disabled={!isEditing}>
                <option value="Al Contado">Al Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
            ) : (
              <p className={pageStyles.value}>{details.payment_condition || '-'}</p>
            )}
          </div>
          
          {(isEditing ? formData.payment_condition === 'Crédito' : details.payment_condition === 'Crédito') && (
            <div className={styles.inputGroup}>
              {/* --- CORRECCIÓN DE JSX --- */}
              <label>Días de Crédito</label>
              {isEditing ? (
                <input type="number" name="credit_days" value={formData.credit_days || 0} onChange={handleChange} min="0" />
              ) : (
                <p className={pageStyles.value}>{details.credit_days}</p>
              )}
            </div>
          )}

          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Cuenta Bancaria del Proveedor</label>
            {isEditing ? (
              <select name="supplier_bank_account_id" value={formData.supplier_bank_account_id || ''} onChange={handleChange} disabled={!isEditing || !details.supplier?.bank_accounts?.length}>
                <option value="" disabled>Seleccionar cuenta...</option>
                {details.supplier?.bank_accounts?.map((acc: BankAccount) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.currency} - {acc.account_number}
                  </option>
                ))}
              </select>
            ) : (
              <p className={pageStyles.value}>
                {details.supplier?.bank_accounts?.find((acc: BankAccount) => acc.id === details.supplier_bank_account_id)?.account_number || 'No seleccionada'}
              </p>
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

        {!canEdit && <p style={{color: 'var(--color-text-secondary)', marginTop: '1.5rem'}}>Asigna un proveedor a la orden para poder definir las condiciones de compra.</p>}
      </form>
    </div>
  );
};