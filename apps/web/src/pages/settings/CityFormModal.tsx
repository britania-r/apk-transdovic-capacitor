// File: apps/web/src/pages/settings/CityFormModal.tsx

import { useState, useEffect } from 'react';
import type { City } from './CitiesPage';
import styles from '../../pages/users/UserFormModal.module.css'; // Reutilizamos estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cityData: { id?: string; name: string }) => void;
  cityToEdit: City | null;
  isLoading: boolean;
}

export const CityFormModal = ({ isOpen, onClose, onSubmit, cityToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!cityToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(cityToEdit?.name || '');
    }
  }, [isOpen, cityToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ id: cityToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Ciudad' : 'Crear Nueva Ciudad'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre de la Ciudad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lima"
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