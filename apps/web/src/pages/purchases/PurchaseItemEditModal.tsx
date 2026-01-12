// File: apps/web/src/pages/purchases/PurchaseItemEditModal.tsx

import { useState, useEffect } from 'react';
import type { PurchaseOrderItem } from './PurchasesDetailsPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: number; quantity: number; unit_price: number }) => void;
  itemToEdit: PurchaseOrderItem | null;
  isLoading: boolean;
}

export const PurchaseItemEditModal = ({ isOpen, onClose, onSubmit, itemToEdit, isLoading }: Props) => {
  const [form, setForm] = useState({ quantity: 1, unit_price: 0 });

  useEffect(() => {
    if (itemToEdit) {
      setForm({
        quantity: itemToEdit.quantity,
        unit_price: itemToEdit.unit_price,
      });
    }
  }, [itemToEdit]);

  if (!isOpen || !itemToEdit) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: itemToEdit.id,
      quantity: form.quantity,
      unit_price: form.unit_price,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <h3>Editar Ítem de la Orden</h3>
        <p style={{ margin: '-1rem 0 1.5rem', color: 'var(--color-text-secondary)' }}>
          {itemToEdit.product_name || itemToEdit.service_description || 'Ítem'}
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Cantidad</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Precio Unitario ({itemToEdit.currency})</label>
            <input
              type="number"
              name="unit_price"
              value={form.unit_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};