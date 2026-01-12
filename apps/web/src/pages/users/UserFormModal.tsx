// File: apps/web/src/pages/users/UserFormModal.tsx

import { useState, useEffect } from 'react';
import type { UserProfile } from './UsersPage';
import styles from './UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, hasNewPassword: boolean) => void;
  userToEdit: UserProfile | null;
  isLoading: boolean;
}

const initialFormData = {
  first_name: '',
  paternal_last_name: '',
  maternal_last_name: '',
  email: '',
  password: '',
  role: 'Conductor carga pesada',
  dni: '',
  drivers_license: '',
  date_of_birth: ''
};

export const UserFormModal = ({ isOpen, onClose, onSubmit, userToEdit, isLoading }: Props) => {
  const [formData, setFormData] = useState(initialFormData);
  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen && userToEdit) {
      setFormData({ 
        ...initialFormData,
        ...userToEdit, 
        password: ''
      });
    } else if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen, userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasNewPassword = formData.password.length > 0;
    onSubmit(formData, hasNewPassword);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nombres</label>
            <input name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Apellido Paterno</label>
            <input name="paternal_last_name" value={formData.paternal_last_name} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Apellido Materno</label>
            <input name="maternal_last_name" value={formData.maternal_last_name} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} />
          </div>

          {isEditMode ? (
            <div className={styles.inputGroup}>
              <label>Nueva Contraseña (Opcional)</label>
              <input name="password" type="password" placeholder="Dejar en blanco para no cambiar" value={formData.password} onChange={handleChange} minLength={6} />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label>Contraseña</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Rol</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="Gerente">Gerente</option>
              <option value="Administrador">Administrador</option>
              <option value="Conductor carga pesada">Conductor carga pesada</option>
              <option value="Asistente administrativo">Asistente administrativo</option>
              <option value="Asistente de procesos">Asistente de procesos</option>
              <option value="Conductor de patio">Conductor de patio</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>DNI</label>
            <input name="dni" value={formData.dni} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Brevete (Opcional)</label>
            <input name="drivers_license" value={formData.drivers_license || ''} onChange={handleChange} />
          </div>
          <div className={styles.inputGroup}>
            <label>Fecha de Nacimiento</label>
            <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} required />
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};