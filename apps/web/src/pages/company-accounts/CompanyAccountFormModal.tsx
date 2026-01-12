import { useState, useEffect } from 'react';
import type { CompanyAccount } from './CompanyAccountsPage';
import type { Bank } from '../settings/BanksPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accountToEdit: CompanyAccount | null;
  banks: Bank[];
  isLoading: boolean;
}

const initialForm = { 
  bank_id: '', 
  currency: 'PEN', 
  account_number: '',
  account_type: 'BANCO' // Por defecto creamos bancos
};

export const CompanyAccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit, banks, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  const isEditMode = !!accountToEdit;

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setForm({
          bank_id: accountToEdit.bank_id || '',
          currency: accountToEdit.currency,
          account_number: accountToEdit.account_number || '',
          account_type: accountToEdit.account_type || 'BANCO'
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [isOpen, accountToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpieza de datos antes de enviar
    const dataToSend = {
        ...form,
        // Si es caja, mandamos null en bank_id y account_number
        bank_id: form.account_type === 'CAJA' ? null : form.bank_id,
        account_number: form.account_type === 'CAJA' ? null : form.account_number,
    };

    onSubmit({ id: accountToEdit?.id, ...dataToSend });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar' : 'Agregar'} Cuenta o Caja</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Tipo</label>
            <select name="account_type" value={form.account_type} onChange={handleChange} disabled={isEditMode}>
              <option value="BANCO">Cuenta Bancaria</option>
              <option value="CAJA">Caja Chica</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Moneda</label>
            <select name="currency" value={form.currency} onChange={handleChange} required>
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares ($)</option>
            </select>
          </div>

          {/* Mostrar Banco y N° Cuenta SOLO si es BANCO */}
          {form.account_type === 'BANCO' && (
            <>
                <div className={styles.inputGroup}>
                    <label>Banco</label>
                    <select name="bank_id" value={form.bank_id} onChange={handleChange} required>
                    <option value="" disabled>Seleccionar banco...</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Número de Cuenta</label>
                    <input name="account_number" value={form.account_number} onChange={handleChange} required />
                </div>
            </>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};