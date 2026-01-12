// File: apps/web/src/pages/settings/BankFormModal.tsx

import { useState, useEffect } from 'react';
import type { Bank } from './BanksPage';
import styles from '../users/UserFormModal.module.css'; // Reutilizamos estilos del modal

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bankData: { id?: string; name: string }) => void;
  bankToEdit: Bank | null;
  isLoading: boolean;
}

export const BankFormModal = ({ isOpen, onClose, onSubmit, bankToEdit, isLoading }: Props) => {
  const [name, setName] = useState('');
  const isEditMode = !!bankToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(bankToEdit?.name || '');
    }
  }, [isOpen, bankToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre del banco no puede estar vacío.');
      return;
    }
    onSubmit({ id: bankToEdit?.id, name });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Banco' : 'Crear Nuevo Banco'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del Banco</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Banco de Crédito del Perú" required autoFocus />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};