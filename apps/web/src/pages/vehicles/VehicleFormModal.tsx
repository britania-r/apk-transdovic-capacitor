// File: apps/web/src/pages/vehicles/VehicleFormModal.tsx
import { useState, useEffect } from 'react';
import type { Vehicle } from './VehiclesPage';
import styles from '../../pages/users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Vehicle, 'id'> | Vehicle) => void;
  vehicleToEdit: Vehicle | null;
  isLoading: boolean;
}

const initialFormData = {
  plate: '',
  capacity_kg: 0,
  tuse: '',
};

export const VehicleFormModal = ({ isOpen, onClose, onSubmit, vehicleToEdit, isLoading }: Props) => {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>(initialFormData);
  const isEditMode = !!vehicleToEdit;

  useEffect(() => {
    if (isOpen) {
      if (vehicleToEdit) {
        setFormData(vehicleToEdit);
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, vehicleToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'capacity_kg' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && vehicleToEdit) {
      onSubmit({ ...formData, id: vehicleToEdit.id });
    } else {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</h3>
        <form onSubmit={handleSubmit} className={styles.form} style={{ gridTemplateColumns: '1fr' }}>
          <div className={styles.inputGroup}>
            <label>Placa</label>
            <input name="plate" value={formData.plate} onChange={handleChange} placeholder="Ej: F7X-847" required />
          </div>
          <div className={styles.inputGroup}>
            <label>Capacidad (Kg)</label>
            <input name="capacity_kg" type="number" value={formData.capacity_kg} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label>TUSE</label>
            <input name="tuse" value={formData.tuse || ''} onChange={handleChange} />
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};