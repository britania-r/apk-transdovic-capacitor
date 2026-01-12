// File: apps/web/src/pages/suppliers/ContactFormModal.tsx

import { useState, useEffect } from 'react';
import type { Contact } from './SuppliersDetailsPage';
import styles from '../users/UserFormModal.module.css';

interface Props { isOpen: boolean; onClose: () => void; onSubmit: (data) => void; contactToEdit: Contact | null; isLoading: boolean; }
const initialForm = { contact_type: 'Celular', contact_value: '' };

export const ContactFormModal = ({ isOpen, onClose, onSubmit, contactToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  useEffect(() => { if (isOpen) setForm(contactToEdit ? { contact_type: contactToEdit.contact_type, contact_value: contactToEdit.contact_value } : initialForm); }, [isOpen, contactToEdit]);
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ id: contactToEdit?.id, ...form }); };

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{contactToEdit ? 'Editar' : 'Agregar'} Contacto</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}><label>Tipo</label>
            <select name="contact_type" value={form.contact_type} onChange={handleChange} required>
              <option value="Celular">Celular</option>
              <option value="Fijo">Fijo</option>
            </select>
          </div>
          <div className={styles.inputGroup}><label>Número / Contacto</label><input name="contact_value" value={form.contact_value} onChange={handleChange} required /></div>
          <div className={styles.actions} style={{ gridColumn: '1 / -1' }}><button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button><button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </div>
    </div>
  );
};