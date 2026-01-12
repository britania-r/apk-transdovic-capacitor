// File: apps/web/src/pages/settings/UnitFormModal.tsx

import { useState, useEffect } from 'react';
import type { Unit } from './UnitsPage';
import styles from '../../pages/users/UserFormModal.module.css'; // Reutilizamos estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: { id?: string; name: string }) => void;
  unitToEdit: Unit | null;
  isLoading: boolean;
}

export const UnitFormModal = ({ isOpen, onClose, onSubmit, unitToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!unitToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(unitToEdit?.name || '');
    }
  }, [isOpen, unitToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ id: unitToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Unidad' : 'Crear Nueva Unidad'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre de la Unidad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Kilogramo (Kg)"
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