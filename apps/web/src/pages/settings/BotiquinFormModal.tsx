// File: apps/web/src/pages/settings/BotiquinFormModal.tsx

import { useState, useEffect } from 'react';
import type { BotiquinItem } from './BotiquinPage';
import styles from '../../pages/users/UserFormModal.module.css'; // Reutilizamos los mismos estilos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: { id?: string; name: string }) => void; // 'itemData'
  itemToEdit: BotiquinItem | null; // Cambiado de 'categoryToEdit'
  isLoading: boolean;
}

export const BotiquinFormModal = ({ isOpen, onClose, onSubmit, itemToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!itemToEdit; // La lógica se basa en 'itemToEdit'

  useEffect(() => {
    if (isOpen) {
      setName(itemToEdit?.name || '');
    }
  }, [isOpen, itemToEdit]); // Dependencia actualizada

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    onSubmit({ id: itemToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Elemento' : 'Crear Nuevo Elemento'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del Elemento</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vendas, Alcohol, Paracetamol"
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