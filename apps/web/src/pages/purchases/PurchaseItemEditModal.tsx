// File: apps/web/src/pages/purchases/PurchaseItemEditModal.tsx
import { useState, useEffect } from 'react';
import type { PurchaseOrderItem } from './PurchasesDetailsPage';
import formStyles from '../../components/ui/FormModal.module.css';

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

  const itemName = itemToEdit.product_name
    || itemToEdit.service_description
    || itemToEdit.service_name
    || itemToEdit.first_aid_item_name
    || itemToEdit.vehicle_plate
    || 'Ítem';

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={formStyles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-pencil"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Editar ítem</h3>
              <p className={formStyles.modalSubtitle}>{itemName}</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>
            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Cantidad <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  className={formStyles.input}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Precio unitario ({itemToEdit.currency}) <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={form.unit_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className={formStyles.input}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={formStyles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={formStyles.cancelBtn}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={formStyles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-save"></i> Guardar cambios</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};