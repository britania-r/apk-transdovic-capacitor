// File: apps/web/src/pages/users/UserFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { UserProfile } from './UsersPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, hasNewPassword: boolean) => void;
  userToEdit: UserProfile | null;
  isLoading: boolean;
}

const ROLES = [
  { value: 'Gerente',                  label: 'Gerente'                  },
  { value: 'Administrador',            label: 'Administrador'            },
  { value: 'Conductor carga pesada',   label: 'Conductor carga pesada'   },
  { value: 'Asistente administrativo', label: 'Asistente administrativo' },
  { value: 'Asistente de procesos',    label: 'Asistente de procesos'    },
  { value: 'Conductor de patio',       label: 'Conductor de patio'       },
];

const INITIAL: any = {
  first_name:      '',
  email:           '',
  password:        '',
  role:            'Conductor carga pesada',
  dni:             '',
  drivers_license: '',
  date_of_birth:   '',
};

export const UserFormModal = ({ isOpen, onClose, onSubmit, userToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!userToEdit;

  useEffect(() => {
    if (!isOpen) return;
    setForm(userToEdit ? { ...INITIAL, ...userToEdit, password: '' } : INITIAL);
  }, [isOpen, userToEdit]);

  const set = (field: string, value: string) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.name, e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, form.password.length > 0);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-user-plus'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del usuario' : 'Completa los datos para crear un usuario'}
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

            <div className={styles.field}>
              <label className={styles.label}>
                Nombre completo <span className={styles.required}>*</span>
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez García"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@empresa.com"
                  required
                  disabled={isEdit}
                  className={`${styles.input} ${isEdit ? styles.inputDisabled : ''}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  {isEdit ? 'Nueva contraseña' : 'Contraseña'}
                  {!isEdit && <span className={styles.required}> *</span>}
                  {isEdit  && <span className={styles.optional}> (opcional)</span>}
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                  required={!isEdit}
                  minLength={6}
                  className={styles.input}
                />
              </div>
            </div>

            <SimpleSelect
              label="Rol"
              options={ROLES}
              value={form.role}
              onChange={v => set('role', v)}
              required
            />

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  DNI <span className={styles.required}>*</span>
                </label>
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="12345678"
                  required
                  maxLength={8}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Brevete <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="drivers_license"
                  value={form.drivers_license || ''}
                  onChange={handleChange}
                  placeholder="Ej. A-IIa"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Fecha de nacimiento <span className={styles.required}>*</span>
              </label>
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

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