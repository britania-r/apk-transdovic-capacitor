// File: apps/web/src/pages/suppliers/EmailFormModal.tsx
import { useState, useEffect } from 'react';
import type { Email } from './SuppliersDetailsPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; email: string; notes: string }) => void;
  emailToEdit: Email | null;
  isLoading: boolean;
}

const INITIAL = { email: '', notes: '' };

export const EmailFormModal = ({ isOpen, onClose, onSubmit, emailToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!emailToEdit;

  useEffect(() => {
    if (!isOpen) return;
    setForm(emailToEdit
      ? { email: emailToEdit.email, notes: emailToEdit.notes || '' }
      : INITIAL
    );
  }, [isOpen, emailToEdit]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: emailToEdit?.id, ...form });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-envelope"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>{isEdit ? 'Editar email' : 'Nuevo email'}</h3>
              <p className={styles.modalSubtitle}>{isEdit ? 'Modifica el email' : 'Agrega un email de contacto'}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>
            <div className={styles.field}>
              <label className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="Ej. contacto@empresa.com"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Notas <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Ej. Email para facturación"
                rows={3}
                className={styles.input}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
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