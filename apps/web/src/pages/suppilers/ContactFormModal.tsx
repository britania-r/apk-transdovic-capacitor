// File: apps/web/src/pages/suppliers/ContactFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { Contact } from './SuppliersDetailsPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; contact_type: string; contact_value: string }) => void;
  contactToEdit: Contact | null;
  isLoading: boolean;
}

const INITIAL = { contact_type: 'Celular', contact_value: '' };

const TYPE_OPTIONS = [
  { value: 'Celular', label: 'Celular' },
  { value: 'Fijo', label: 'Teléfono fijo' },
];

export const ContactFormModal = ({ isOpen, onClose, onSubmit, contactToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!contactToEdit;

  useEffect(() => {
    if (!isOpen) return;
    setForm(contactToEdit
      ? { contact_type: contactToEdit.contact_type, contact_value: contactToEdit.contact_value }
      : INITIAL
    );
  }, [isOpen, contactToEdit]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: contactToEdit?.id, ...form });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-phone"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>{isEdit ? 'Editar contacto' : 'Nuevo contacto'}</h3>
              <p className={styles.modalSubtitle}>{isEdit ? 'Modifica el contacto' : 'Agrega un número de contacto'}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>
            <div className={styles.row}>
              <SimpleSelect
                label="Tipo"
                options={TYPE_OPTIONS}
                value={form.contact_type}
                onChange={v => set('contact_type', v)}
                required
              />
              <div className={styles.field}>
                <label className={styles.label}>
                  Número <span className={styles.required}>*</span>
                </label>
                <input
                  value={form.contact_value}
                  onChange={e => set('contact_value', e.target.value)}
                  placeholder="Ej. 987654321"
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