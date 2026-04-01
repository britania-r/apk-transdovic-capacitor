// File: apps/web/src/pages/purchases/ConditionsSection.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { PurchaseOrderDetails, BankAccount } from './PurchasesDetailsPage';
import styles from './SectionShared.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

const PAYMENT_CONDITION_OPTIONS = [
  { value: 'Al Contado', label: 'Al Contado' },
  { value: 'Crédito', label: 'Crédito' },
];

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

export const ConditionsSection = ({ details }: Props) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    currency: details.currency || 'PEN',
    payment_condition: details.payment_condition || 'Al Contado',
    credit_days: details.credit_days || 0,
    supplier_bank_account_id: details.supplier_bank_account_id || '',
  });

  useEffect(() => {
    setForm({
      currency: details.currency || 'PEN',
      payment_condition: details.payment_condition || 'Al Contado',
      credit_days: details.credit_days || 0,
      supplier_bank_account_id: details.supplier_bank_account_id || '',
    });
  }, [details]);

  const bankAccountOptions = (details.supplier?.bank_accounts || []).map((acc: BankAccount) => ({
    value: acc.id,
    label: `${acc.bank_name} — ${acc.currency} — ${acc.account_number}`,
  }));

  const selectedBankLabel = details.supplier?.bank_accounts?.find(
    (acc: BankAccount) => acc.id === details.supplier_bank_account_id
  );

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update(data)
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Condiciones actualizadas');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleCancel = () => {
    setForm({
      currency: details.currency || 'PEN',
      payment_condition: details.payment_condition || 'Al Contado',
      credit_days: details.credit_days || 0,
      supplier_bank_account_id: details.supplier_bank_account_id || '',
    });
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const canEdit = !!details.supplier;
  const showCreditDays = isEditing
    ? form.payment_condition === 'Crédito'
    : details.payment_condition === 'Crédito';

  if (!canEdit) {
    return (
      <div className={styles.section}>
        <p className={styles.notice}>
          Asigna un proveedor a la orden para poder definir las condiciones de compra.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <form onSubmit={handleSubmit}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Condiciones de compra</h3>
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
                <SimpleSelect
                  label="Moneda"
                  options={CURRENCY_OPTIONS}
                  value={form.currency}
                  onChange={v => setForm(prev => ({ ...prev, currency: v }))}
                />
              </div>
              <div className={styles.field}>
                <SimpleSelect
                  label="Condición de pago"
                  options={PAYMENT_CONDITION_OPTIONS}
                  value={form.payment_condition || 'Al Contado'}
                  onChange={v => setForm(prev => ({
                    ...prev,
                    payment_condition: v,
                    credit_days: v === 'Al Contado' ? 0 : prev.credit_days,
                  }))}
                />
              </div>
              {showCreditDays && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Días de crédito</label>
                  <input
                    type="number"
                    min="0"
                    value={form.credit_days}
                    onChange={e => setForm(prev => ({ ...prev, credit_days: parseInt(e.target.value) || 0 }))}
                    className={styles.fieldInput}
                  />
                </div>
              )}
              <div className={styles.fieldFull}>
                <SimpleSelect
                  label="Cuenta bancaria del proveedor"
                  options={bankAccountOptions}
                  value={form.supplier_bank_account_id}
                  onChange={v => setForm(prev => ({ ...prev, supplier_bank_account_id: v }))}
                  placeholder="Seleccionar cuenta..."
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
              <span className={styles.dataLabel}>Moneda</span>
              <span className={styles.dataValue}>{details.currency || '—'}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Condición de pago</span>
              <span className={styles.dataValue}>{details.payment_condition || '—'}</span>
            </div>
            {showCreditDays && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Días de crédito</span>
                <span className={styles.dataValue}>{details.credit_days}</span>
              </div>
            )}
            <div className={styles.dataItemFull}>
              <span className={styles.dataLabel}>Cuenta bancaria del proveedor</span>
              <span className={styles.dataValue}>
                {selectedBankLabel
                  ? `${selectedBankLabel.bank_name} — ${selectedBankLabel.currency} — ${selectedBankLabel.account_number}`
                  : 'No seleccionada'}
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};