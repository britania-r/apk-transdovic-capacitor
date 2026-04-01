// File: apps/web/src/pages/vehicles/VehicleFormModal.tsx
import { useState, useEffect } from 'react';
import type { Vehicle } from './VehiclesPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Vehicle, 'id'> | Vehicle) => void;
  vehicleToEdit: Vehicle | null;
  isLoading: boolean;
}

const INITIAL: Omit<Vehicle, 'id'> = {
  plate: '',
  capacity_kg: 0,
  tuse: '',
};

export const VehicleFormModal = ({ isOpen, onClose, onSubmit, vehicleToEdit, isLoading }: Props) => {
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(INITIAL);
  const isEdit = !!vehicleToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (vehicleToEdit) {
      setForm({
        plate: vehicleToEdit.plate,
        capacity_kg: vehicleToEdit.capacity_kg,
        tuse: vehicleToEdit.tuse || '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, vehicleToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'capacity_kg' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && vehicleToEdit) {
      onSubmit({ ...form, id: vehicleToEdit.id });
    } else {
      onSubmit(form);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-car'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del vehículo' : 'Completa los datos para registrar un vehículo'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            <div className={styles.field}>
              <label className={styles.label}>
                Placa <span className={styles.required}>*</span>
              </label>
              <input
                name="plate"
                value={form.plate}
                onChange={handleChange}
                placeholder="Ej. F7X-847"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Capacidad (Kg) <span className={styles.required}>*</span>
                </label>
                <input
                  name="capacity_kg"
                  type="number"
                  value={form.capacity_kg || ''}
                  onChange={handleChange}
                  placeholder="Ej. 30000"
                  required
                  min={0}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  TUCE <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="tuse"
                  value={form.tuse || ''}
                  onChange={handleChange}
                  placeholder="Ej. 12345"
                  className={styles.input}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-save"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};