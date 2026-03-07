// File: apps/web/src/pages/company-accounts/CompanyAccountFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { CompanyAccount } from './CompanyAccountsPage';
import type { Bank } from '../settings/BanksPage';
import styles from '../../components/ui/FormModal.module.css';
import localStyles from './CompanyAccountFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accountToEdit: CompanyAccount | null;
  banks: Bank[];
  isLoading: boolean;
}

const INITIAL = {
  bank_id: '',
  currency: 'PEN',
  account_number: '',
  account_type: 'BANCO',
};

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (S/)' },
  { value: 'USD', label: 'Dólares ($)' },
];

const TYPE_OPTIONS = [
  { value: 'BANCO', label: 'Cuenta Bancaria' },
  { value: 'CAJA', label: 'Caja Chica' },
];

export const CompanyAccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit, banks, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!accountToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (accountToEdit) {
      setForm({
        bank_id: accountToEdit.bank_id || '',
        currency: accountToEdit.currency,
        account_number: accountToEdit.account_number || '',
        account_type: accountToEdit.account_type || 'BANCO',
      });
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, accountToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.name, e.target.value);

  const bankOptions = banks.map(b => ({ value: b.id, label: b.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...form,
      bank_id: form.account_type === 'CAJA' ? null : form.bank_id,
      account_number: form.account_type === 'CAJA' ? null : form.account_number,
    };
    onSubmit({ id: accountToEdit?.id, ...dataToSend });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-wallet'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos de la cuenta' : 'Registra una cuenta bancaria o caja chica'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            {/* Tipo — deshabilitado en edición */}
            <div className={localStyles.typeSelector}>
              <label className={styles.label}>
                Tipo <span className={styles.required}>*</span>
              </label>
              <div className={localStyles.typeOptions}>
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${localStyles.typeBtn} ${form.account_type === opt.value ? localStyles.typeBtnActive : ''}`}
                    onClick={() => !isEdit && set('account_type', opt.value)}
                    disabled={isEdit}
                  >
                    <i className={`bx ${opt.value === 'BANCO' ? 'bxs-bank' : 'bx-box'}`}></i>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <SimpleSelect
              label="Moneda"
              options={CURRENCY_OPTIONS}
              value={form.currency}
              onChange={v => set('currency', v)}
              required
            />

            {/* Campos condicionales — solo para BANCO */}
            {form.account_type === 'BANCO' && (
              <>
                <SimpleSelect
                  label="Banco"
                  options={bankOptions}
                  value={form.bank_id}
                  onChange={v => set('bank_id', v)}
                  placeholder="Seleccionar banco..."
                  required
                />

                <div className={styles.field}>
                  <label className={styles.label}>
                    Número de cuenta <span className={styles.required}>*</span>
                  </label>
                  <input
                    name="account_number"
                    value={form.account_number}
                    onChange={handleChange}
                    placeholder="Ej. 00-123-456789-0-12"
                    required
                    className={styles.input}
                  />
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
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