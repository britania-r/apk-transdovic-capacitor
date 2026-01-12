import { useState, useEffect } from 'react';
import type { ProductWithDetails, Category, Subcategory, Unit, ProductFormData } from './ProductsPage';
import styles from '../users/UserFormModal.module.css';
import productFormStyles from './ProductFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; formData: ProductFormData, imageFile?: File | null }) => void;
  productToEdit: ProductWithDetails | null;
  categories: Category[];
  subcategories: Subcategory[];
  units: Unit[];
  isLoading: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  low_stock_threshold: 0,
  category_id: '',
  subcategory_id: null,
  unit_id: '',
};

export const ProductFormModal = ({ isOpen, onClose, onSubmit, productToEdit, categories, subcategories, units, isLoading }: Props) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  
  const isEditMode = !!productToEdit;

  // Efecto para popular el formulario en modo edición
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          description: productToEdit.description || '',
          low_stock_threshold: productToEdit.low_stock_threshold,
          category_id: productToEdit.category_id,
          subcategory_id: productToEdit.subcategory_id,
          unit_id: productToEdit.unit_id,
        });
        setImagePreview(productToEdit.image_url);
        setImageFile(null);
      } else {
        setFormData(initialFormData);
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [isOpen, productToEdit]);

  // Efecto para filtrar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(sub => sub.category_id === formData.category_id);
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  }, [formData.category_id, subcategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['low_stock_threshold'].includes(name);
    
    // Si cambia la categoría, reseteamos la subcategoría
    if (name === 'category_id') {
      setFormData(prev => ({ ...prev, category_id: value, subcategory_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: isNumeric ? parseInt(value, 10) || 0 : value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(productToEdit) {
      // Si estamos en modo edición, al quitar la imagen también la quitaremos del producto
      // Esto se podría manejar de otra forma, pero por ahora la quita.
      setFormData(prev => ({ ...prev, image_url: null }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: productToEdit?.id, formData, imageFile });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del Producto</label>
            <input name="name" value={formData.name} onChange={handleChange} required autoFocus />
          </div>

          <div className={`${styles.inputGroup} ${productFormStyles.imageUploaderContainer}`}>
            <label>Imagen</label>
            <div className={productFormStyles.imageUploader}>
              {imagePreview ? (
                <div className={productFormStyles.imagePreviewWrapper}>
                  <img src={imagePreview} alt="Vista previa" className={productFormStyles.imagePreview} />
                  <button type="button" onClick={handleRemoveImage} className={productFormStyles.removeImageButton} title="Quitar imagen">
                    <i className='bx bx-trash'></i>
                  </button>
                </div>
              ) : (
                <label className={productFormStyles.uploadBox}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  <i className='bx bx-image-add'></i>
                  <span>Subir Imagen</span>
                </label>
              )}
            </div>
          </div>

          <div className={styles.inputGroup} style={{ gridRow: '2 / span 2' }}>
            <label>Descripción</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className={styles.textarea} rows={5} />
          </div>

          <div className={styles.inputGroup}><label>Categoría</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} required>
              <option value="" disabled>Seleccionar...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}><label>Subcategoría</label>
            <select name="subcategory_id" value={formData.subcategory_id || ''} onChange={handleChange} disabled={!formData.category_id}>
              <option value="">(Opcional)</option>
              {filteredSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}><label>Unidad</label>
            <select name="unit_id" value={formData.unit_id} onChange={handleChange} required>
              <option value="" disabled>Seleccionar...</option>
              {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}><label>Alerta de Stock Bajo</label>
            <input name="low_stock_threshold" type="number" value={formData.low_stock_threshold} onChange={handleChange} required />
          </div>

          <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};