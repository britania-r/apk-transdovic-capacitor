// File: apps/web/src/pages/settings/ServiciosFormModal.tsx

import { useState, useEffect } from 'react';
import type { Servicio } from './ServiciosPage';
import styles from '../../pages/users/UserFormModal.module.css'; // Reutilizamos los mismos estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (servicioData: { id?: string; name: string }) => void;
  servicioToEdit: Servicio | null;
  isLoading: boolean;
}

export const ServiciosFormModal = ({ isOpen, onClose, onSubmit, servicioToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!servicioToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(servicioToEdit?.name || '');
    }
  }, [isOpen, servicioToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    onSubmit({ id: servicioToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del Servicio</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mantenimiento Preventivo"
              required
              autoFocus
            />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};