// File: apps/web/src/pages/suppliers/EmailFormModal.tsx

import { useState, useEffect } from 'react';
import type { Email } from './SuppliersDetailsPage';
import styles from '../users/UserFormModal.module.css';

interface Props { isOpen: boolean; onClose: () => void; onSubmit: (data) => void; emailToEdit: Email | null; isLoading: boolean; }
const initialForm = { email: '', notes: '' };

export const EmailFormModal = ({ isOpen, onClose, onSubmit, emailToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  useEffect(() => { if (isOpen) setForm(emailToEdit ? { email: emailToEdit.email, notes: emailToEdit.notes || '' } : initialForm); }, [isOpen, emailToEdit]);
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ id: emailToEdit?.id, ...form }); };

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{emailToEdit ? 'Editar' : 'Agregar'} Email</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}><label>Dirección de Email</label><input type="email" name="email" value={form.email} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}><label>Notas (Opcional)</label><textarea name="notes" value={form.notes} onChange={handleChange} className={styles.textarea} rows={3}></textarea></div>
          <div className={styles.actions} style={{ gridColumn: '1 / -1' }}><button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button><button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </div>
    </div>
  );
};