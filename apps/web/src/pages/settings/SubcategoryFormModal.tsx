import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { SubcategoryWithCategory } from './SubcategoriesPage';
import type { Category } from './CategoriesPage';
// --- CORRECCIÓN CLAVE ---
import styles from '../users/UserFormModal.module.css'; // Ruta correcta para salir de /settings

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; name: string; category_id: string }) => void;
  subcategoryToEdit: SubcategoryWithCategory | null;
  categories: Category[];
  isLoading: boolean;
}

const initialFormState = { name: '', category_id: '' };

export const SubcategoryFormModal = ({ isOpen, onClose, onSubmit, subcategoryToEdit, categories, isLoading }: Props) => {
  const [formData, setFormData] = useState(initialFormState);
  const isEditMode = !!subcategoryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (subcategoryToEdit) {
        setFormData({
          name: subcategoryToEdit.name,
          category_id: subcategoryToEdit.category_id,
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [isOpen, subcategoryToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }
    onSubmit({ id: subcategoryToEdit?.id, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Subcategoría' : 'Crear Nueva Subcategoría'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Categoría Padre</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} required>
              <option value="" disabled>Selecciona una categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre de la Subcategoría</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Leche Fresca" required autoFocus />
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