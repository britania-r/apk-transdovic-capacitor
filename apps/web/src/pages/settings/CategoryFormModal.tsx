// File: apps/web/src/pages/settings/CategoryFormModal.tsx

import { useState, useEffect } from 'react';
import type { Category } from './CategoriesPage';
import styles from '../../pages/users/UserFormModal.module.css'; // Reutilizamos estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryData: { id?: string; name: string }) => void;
  categoryToEdit: Category | null;
  isLoading: boolean;
}

export const CategoryFormModal = ({ isOpen, onClose, onSubmit, categoryToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(categoryToEdit?.name || '');
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    onSubmit({ id: categoryToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre de la Categoría</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Carga Seca"
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