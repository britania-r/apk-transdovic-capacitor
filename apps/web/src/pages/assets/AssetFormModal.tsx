// File: apps/web/src/pages/assets/AssetFormModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { Asset, Category, Subcategory } from './AssetsPage';
import styles from '../../components/ui/FormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  assetToEdit: Asset | null;
  categories: Category[];
  subcategories: Subcategory[];
  isLoading: boolean;
}

const INITIAL = {
  name: '',
  description: '',
  category_id: '',
  subcategory_id: '',
  brand: '',
  model: '',
  serial_number: '',
  cost: '',
};

export const AssetFormModal = ({ isOpen, onClose, onSubmit, assetToEdit, categories, subcategories, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!assetToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (assetToEdit) {
      setForm({
        name: assetToEdit.name,
        description: assetToEdit.description || '',
        category_id: assetToEdit.category_id,
        subcategory_id: assetToEdit.subcategory_id || '',
        brand: assetToEdit.brand || '',
        model: assetToEdit.model || '',
        serial_number: assetToEdit.serial_number || '',
        cost: String(assetToEdit.cost || ''),
      });
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, assetToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(e.target.name, e.target.value);

  // Subcategorías filtradas por categoría seleccionada
  const filteredSubcategories = useMemo(() =>
    subcategories.filter(sc => sc.category_id === form.category_id),
    [subcategories, form.category_id]
  );

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const subcategoryOptions = filteredSubcategories.map(sc => ({ value: sc.id, label: sc.name }));

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({ ...prev, category_id: value, subcategory_id: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCost = parseFloat(form.cost);
    onSubmit({
      id: assetToEdit?.id,
      name: form.name,
      description: form.description || null,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      cost: isNaN(finalCost) ? 0 : finalCost,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-box'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar activo' : 'Nuevo activo'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del activo fijo' : 'Completa los datos para registrar un activo'}
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
                Nombre del activo <span className={styles.required}>*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej. Laptop Dell Latitude"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <SimpleSelect
                label="Categoría"
                options={categoryOptions}
                value={form.category_id}
                onChange={handleCategoryChange}
                placeholder="Seleccionar categoría..."
                required
              />

              <SimpleSelect
                label="Subcategoría"
                options={subcategoryOptions}
                value={form.subcategory_id}
                onChange={v => set('subcategory_id', v)}
                placeholder={filteredSubcategories.length > 0 ? 'Seleccionar subcategoría...' : 'Sin subcategorías'}
                disabled={!form.category_id || filteredSubcategories.length === 0}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Marca <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Ej. Dell"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Modelo <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="Ej. Latitude 5540"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Número de serie <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="serial_number"
                  value={form.serial_number}
                  onChange={handleChange}
                  placeholder="Ej. SN-123456"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Costo / Valor (S/) <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="Ej. 1500.50"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Descripción <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Detalles adicionales del activo..."
                className={styles.input}
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