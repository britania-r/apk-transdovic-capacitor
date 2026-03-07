// File: apps/web/src/pages/products/ProductFormModal.tsx
import { useState, useEffect } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { ProductWithDetails, Category, Subcategory, Unit, ProductFormData } from './ProductsPage';
import modalStyles from '../../components/ui/FormModal.module.css';
import styles from './ProductFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; formData: ProductFormData; imageFile?: File | null }) => void;
  productToEdit: ProductWithDetails | null;
  categories: Category[];
  subcategories: Subcategory[];
  units: Unit[];
  isLoading: boolean;
}

const INITIAL: ProductFormData = {
  name: '',
  description: '',
  low_stock_threshold: 0,
  category_id: '',
  subcategory_id: null,
  unit_id: '',
};

export const ProductFormModal = ({
  isOpen, onClose, onSubmit, productToEdit,
  categories, subcategories, units, isLoading,
}: Props) => {
  const [form, setForm] = useState<ProductFormData>(INITIAL);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isEdit = !!productToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setForm({
        name: productToEdit.name,
        description: productToEdit.description || '',
        low_stock_threshold: productToEdit.low_stock_threshold,
        category_id: productToEdit.category_id,
        subcategory_id: productToEdit.subcategory_id,
        unit_id: productToEdit.unit_id,
      });
      setImagePreview(productToEdit.image_url);
    } else {
      setForm(INITIAL);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [isOpen, productToEdit]);

  const filteredSubcategories = subcategories.filter(s => s.category_id === form.category_id);

  const set = (field: string, value: string | number | null) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: productToEdit?.id, formData: form, imageFile });
  };

  if (!isOpen) return null;

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const subcategoryOptions = [
    { value: '', label: '(Sin subcategoría)' },
    ...filteredSubcategories.map(s => ({ value: s.id, label: s.name })),
  ];
  const unitOptions = units.map(u => ({ value: u.id, label: u.name }));

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.headerLeft}>
            <div className={modalStyles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-package'}></i>
            </div>
            <div>
              <h3 className={modalStyles.modalTitle}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
              <p className={modalStyles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del producto' : 'Completa los datos para registrar un producto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={modalStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={modalStyles.form}>
          <div className={modalStyles.formBody}>

            {/* Imagen + Nombre */}
            <div className={styles.topRow}>
              {/* Uploader de imagen */}
              <div className={styles.imageUploader}>
                {imagePreview ? (
                  <div className={styles.imagePreviewWrapper}>
                    <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />
                    <button type="button" onClick={handleRemoveImage} className={styles.removeBtn} title="Quitar imagen">
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadBox}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <i className="bx bx-image-add"></i>
                    <span>Subir imagen</span>
                  </label>
                )}
              </div>

              {/* Nombre + Descripción */}
              <div className={styles.nameArea}>
                <div className={modalStyles.field}>
                  <label className={modalStyles.label}>
                    Nombre <span className={modalStyles.required}>*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Ej. Aceite de motor 15W-40"
                    required
                    className={modalStyles.input}
                    autoFocus
                  />
                </div>
                <div className={modalStyles.field}>
                  <label className={modalStyles.label}>Descripción</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Descripción del producto..."
                    rows={3}
                    className={modalStyles.input}
                    style={{ resize: 'vertical', minHeight: '72px' }}
                  />
                </div>
              </div>
            </div>

            {/* Categoría + Subcategoría */}
            <div className={modalStyles.row}>
              <SimpleSelect
                label="Categoría"
                options={categoryOptions}
                value={form.category_id}
                onChange={v => { set('category_id', v); set('subcategory_id', null); }}
                placeholder="Seleccionar categoría..."
                required
              />
              <SimpleSelect
                label="Subcategoría"
                options={subcategoryOptions}
                value={form.subcategory_id || ''}
                onChange={v => set('subcategory_id', v || null)}
                placeholder="(Sin subcategoría)"
                disabled={!form.category_id}
              />
            </div>

            {/* Unidad + Stock bajo */}
            <div className={modalStyles.row}>
              <SimpleSelect
                label="Unidad"
                options={unitOptions}
                value={form.unit_id}
                onChange={v => set('unit_id', v)}
                placeholder="Seleccionar unidad..."
                required
              />
              <div className={modalStyles.field}>
                <label className={modalStyles.label}>
                  Alerta de stock bajo <span className={modalStyles.required}>*</span>
                </label>
                <input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={e => set('low_stock_threshold', parseInt(e.target.value, 10) || 0)}
                  min={0}
                  required
                  className={modalStyles.input}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={modalStyles.modalFooter}>
            <button type="button" onClick={onClose} className={modalStyles.cancelBtn} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className={modalStyles.submitBtn} disabled={isLoading}>
              {isLoading
                ? <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
                : <><i className="bx bx-save"></i> Guardar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};