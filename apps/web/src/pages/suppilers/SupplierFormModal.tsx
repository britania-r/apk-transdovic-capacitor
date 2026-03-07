// File: apps/web/src/pages/suppliers/SupplierFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { SupplierInList } from './SuppliersPage';
import type { City } from '../settings/CitiesPage';
import type { Category } from '../settings/CategoriesPage';
import styles from '../../components/ui/FormModal.module.css';

type SupplierFormData = {
  trade_name: string;
  legal_name: string;
  ruc: string;
  address: string;
  description: string;
  city_id: string;
  category_id: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string } & SupplierFormData) => void;
  supplierToEdit: SupplierInList | null;
  cities: City[];
  categories: Category[];
  isLoading: boolean;
}

const INITIAL: SupplierFormData = {
  trade_name:  '',
  legal_name:  '',
  ruc:         '',
  address:     '',
  description: '',
  city_id:     '',
  category_id: '',
};

export const SupplierFormModal = ({
  isOpen, onClose, onSubmit, supplierToEdit, cities, categories, isLoading
}: Props) => {
  const [form, setForm] = useState<SupplierFormData>(INITIAL);
  const isEdit = !!supplierToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (supplierToEdit) {
      setForm({
        trade_name:  supplierToEdit.trade_name,
        legal_name:  supplierToEdit.legal_name,
        ruc:         supplierToEdit.ruc,
        address:     supplierToEdit.address || '',
        description: supplierToEdit.description || '',
        city_id:     supplierToEdit.city_id || '',
        category_id: supplierToEdit.category_id || '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, supplierToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(e.target.name, e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: supplierToEdit?.id, ...form });
  };

  if (!isOpen) return null;

  const cityOptions = cities.map(c => ({ value: c.id, label: c.name }));
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-store-alt'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del proveedor' : 'Completa los datos para registrar un proveedor'}
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

            {/* Nombre comercial + Razón social */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre comercial <span className={styles.required}>*</span>
                </label>
                <input
                  name="trade_name"
                  value={form.trade_name}
                  onChange={handleChange}
                  placeholder="Ej. Distribuciones Pérez"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Razón social <span className={styles.required}>*</span>
                </label>
                <input
                  name="legal_name"
                  value={form.legal_name}
                  onChange={handleChange}
                  placeholder="Ej. Pérez S.A.C."
                  required
                  className={styles.input}
                />
              </div>
            </div>

            {/* RUC + Dirección */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  RUC <span className={styles.required}>*</span>
                </label>
                <input
                  name="ruc"
                  value={form.ruc}
                  onChange={handleChange}
                  placeholder="Ej. 20123456789"
                  required
                  maxLength={11}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Dirección</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej. Av. Principal 123"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Ciudad + Categoría */}
            <div className={styles.row}>
              <SimpleSelect
                label="Ciudad"
                options={cityOptions}
                value={form.city_id}
                onChange={v => set('city_id', v)}
                placeholder="Seleccionar ciudad..."
              />
              <SimpleSelect
                label="Categoría"
                options={categoryOptions}
                value={form.category_id}
                onChange={v => set('category_id', v)}
                placeholder="Seleccionar categoría..."
              />
            </div>

            {/* Descripción */}
            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Información adicional del proveedor..."
                rows={3}
                className={styles.input}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
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