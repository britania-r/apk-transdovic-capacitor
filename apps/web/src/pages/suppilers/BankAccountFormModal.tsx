import { useState, useEffect } from 'react';
import type { BankAccount } from './SuppliersDetailsPage';
import type { Bank } from '../settings/BanksPage';
import styles from '../users/UserFormModal.module.css';

interface Props { isOpen: boolean; onClose: () => void; onSubmit: (data) => void; accountToEdit: BankAccount | null; banks: Bank[]; isLoading: boolean; }
const initialForm = { bank_id: '', currency: 'PEN', account_number: '' };

export const BankAccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit, banks, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  useEffect(() => { if (isOpen) setForm(accountToEdit ? { bank_id: accountToEdit.bank_id, currency: accountToEdit.currency, account_number: accountToEdit.account_number } : initialForm); }, [isOpen, accountToEdit]);
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ id: accountToEdit?.id, ...form }); };

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{accountToEdit ? 'Editar' : 'Agregar'} Cuenta Bancaria</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}><label>Banco</label>
            <select name="bank_id" value={form.bank_id} onChange={handleChange} required>
              <option value="" disabled>Seleccionar banco...</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className={styles.inputGroup}><label>Moneda</label>
            <select name="currency" value={form.currency} onChange={handleChange} required>
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares ($)</option>
            </select>
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Número de Cuenta</label><input name="account_number" value={form.account_number} onChange={handleChange} required /></div>
          <div className={styles.actions}><button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button><button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </div>
    </div>
  );
};