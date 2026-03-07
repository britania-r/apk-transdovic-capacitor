// File: apps/web/src/pages/settings/SettingsFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import styles from '../../components/ui/FormModal.module.css';

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  itemToEdit: any | null;
  isLoading: boolean;
  title: string;
  icon?: string;
  fields: FieldConfig[];
}

export const SettingsFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  isLoading,
  title,
  icon = 'bx bx-cog',
  fields,
}: Props) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const isEdit = !!itemToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (itemToEdit) {
      const initial: Record<string, string> = {};
      fields.forEach(f => {
        initial[f.name] = itemToEdit[f.name] ?? '';
      });
      setForm(initial);
    } else {
      const initial: Record<string, string> = {};
      fields.forEach(f => {
        initial[f.name] = '';
      });
      setForm(initial);
    }
  }, [isOpen, itemToEdit, fields]);

  const set = (name: string, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.name, e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form };
    // Convertir strings vacíos a null para campos opcionales
    fields.forEach(f => {
      if (!f.required && data[f.name] === '') {
        data[f.name] = null as any;
      }
    });
    if (isEdit && itemToEdit) {
      onSubmit({ id: itemToEdit.id, ...data });
    } else {
      onSubmit(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : icon}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? `Editar ${title.toLowerCase()}` : `Nuevo ${title.toLowerCase()}`}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit
                  ? `Modifica los datos del registro`
                  : `Completa los datos para crear un registro`}
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
            {fields.map(field => {
              if (field.type === 'select' && field.options) {
                return (
                  <SimpleSelect
                    key={field.name}
                    label={field.label}
                    options={field.options}
                    value={form[field.name] || ''}
                    onChange={v => set(field.name, v)}
                    placeholder={field.placeholder || `Seleccionar ${field.label.toLowerCase()}...`}
                    required={field.required}
                    disabled={field.disabled}
                  />
                );
              }

              return (
                <div key={field.name} className={styles.field}>
                  <label className={styles.label}>
                    {field.label}
                    {field.required
                      ? <span className={styles.required}> *</span>
                      : <span className={styles.optional}> (opcional)</span>
                    }
                  </label>
                  <input
                    name={field.name}
                    type={field.type || 'text'}
                    value={form[field.name] || ''}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={field.disabled}
                    className={`${styles.input} ${field.disabled ? styles.inputDisabled : ''}`}
                  />
                </div>
              );
            })}
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