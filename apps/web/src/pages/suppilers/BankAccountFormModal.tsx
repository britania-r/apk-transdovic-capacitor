// File: apps/web/src/pages/suppliers/BankAccountFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { BankAccount } from './SuppliersDetailsPage';
import type { Bank } from '../settings/BanksPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; bank_id: string; currency: string; account_number: string }) => void;
  accountToEdit: BankAccount | null;
  banks: Bank[];
  isLoading: boolean;
}

const INITIAL = { bank_id: '', currency: 'PEN', account_number: '' };

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

export const BankAccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit, banks, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!accountToEdit;

  useEffect(() => {
    if (!isOpen) return;
    setForm(accountToEdit
      ? { bank_id: accountToEdit.bank_id, currency: accountToEdit.currency, account_number: accountToEdit.account_number }
      : INITIAL
    );
  }, [isOpen, accountToEdit]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: accountToEdit?.id, ...form });
  };

  if (!isOpen) return null;

  const bankOptions = banks.map(b => ({ value: b.id, label: b.name }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-credit-card"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>{isEdit ? 'Editar cuenta' : 'Nueva cuenta bancaria'}</h3>
              <p className={styles.modalSubtitle}>{isEdit ? 'Modifica los datos de la cuenta' : 'Agrega una cuenta bancaria al proveedor'}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>
            <SimpleSelect
              label="Banco"
              options={bankOptions}
              value={form.bank_id}
              onChange={v => set('bank_id', v)}
              placeholder="Seleccionar banco..."
              required
            />

            <div className={styles.row}>
              <SimpleSelect
                label="Moneda"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => set('currency', v)}
                required
              />
              <div className={styles.field}>
                <label className={styles.label}>
                  Número de cuenta <span className={styles.required}>*</span>
                </label>
                <input
                  value={form.account_number}
                  onChange={e => set('account_number', e.target.value)}
                  placeholder="Ej. 000-123456789"
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</> : <><i className="bx bx-save"></i> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};