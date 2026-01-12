// File: apps/web/src/pages/settings/ItfFormModal.tsx

import { useState, useEffect } from 'react';
import type { ItfRate } from './ItfPage';
import styles from '../../pages/users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ItfRate>) => void;
  rateToEdit: ItfRate | null;
  isLoading: boolean;
}

const initialForm = {
  range_start: '',
  range_end: '',
  fixed_amount: '', // CAMBIO 2: Renombrado
};

export const ItfFormModal = ({ isOpen, onClose, onSubmit, rateToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  const isEditMode = !!rateToEdit;

  useEffect(() => {
    if (isOpen) {
      if (rateToEdit) {
        setForm({
          range_start: String(rateToEdit.range_start),
          range_end: String(rateToEdit.range_end),
          fixed_amount: String(rateToEdit.fixed_amount), // CAMBIO 3: Mapeo correcto
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [isOpen, rateToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rangeStart = parseFloat(form.range_start);
    const rangeEnd = parseFloat(form.range_end);
    const fixedAmount = parseFloat(form.fixed_amount); // CAMBIO 4

    if (isNaN(rangeStart) || isNaN(rangeEnd) || isNaN(fixedAmount)) {
      alert('Todos los campos deben ser números válidos.');
      return;
    }
    if (rangeEnd < rangeStart) {
      alert('El valor "Hasta" no puede ser menor que el valor "Desde".');
      return;
    }

    onSubmit({
      id: rateToEdit?.id,
      range_start: rangeStart,
      range_end: rangeEnd,
      fixed_amount: fixedAmount, // CAMBIO 5
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar' : 'Crear'} Regla ITF</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Desde (S/)</label>
            <input name="range_start" type="number" step="0.01" min="0" value={form.range_start} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Hasta (S/)</label>
            <input name="range_end" type="number" step="0.01" min="0" value={form.range_end} onChange={handleChange} required />
          </div>
          
          {/* CAMBIO 6: Input para Monto Fijo en lugar de Porcentaje */}
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Monto Fijo a cobrar (S/)</label>
            <input 
              name="fixed_amount" 
              type="number" 
              step="0.01" 
              min="0" 
              value={form.fixed_amount} 
              onChange={handleChange} 
              placeholder="Ej: 0.50" 
              required 
            />
            <small style={{color: '#666'}}>Se descontará este monto exacto si el movimiento cae en el rango.</small>
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