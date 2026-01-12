// File: apps/web/src/pages/assets/AssetFormModal.tsx

import { useState, useEffect } from 'react';
import type { Asset, Category, Subcategory } from './AssetsPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  assetToEdit: Asset | null;
  categories: Category[];
  subcategories: Subcategory[];
  isLoading: boolean;
}

const initialForm = {
  name: '',
  description: '',
  category_id: '',
  subcategory_id: '',
  brand: '',
  model: '',
  serial_number: '',
  cost: '', // <-- Campo para el costo añadido
};

export const AssetFormModal = ({ isOpen, onClose, onSubmit, assetToEdit, categories, subcategories, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  const isEditMode = !!assetToEdit;

  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (assetToEdit) {
        setForm({
          name: assetToEdit.name,
          description: assetToEdit.description || '',
          category_id: assetToEdit.category_id,
          subcategory_id: assetToEdit.subcategory_id || '',
          brand: assetToEdit.brand || '',
          model: assetToEdit.model || '',
          serial_number: assetToEdit.serial_number || '',
          cost: String(assetToEdit.cost || ''), // <-- Se asigna el costo al editar
        });
        setFilteredSubcategories(subcategories.filter(sc => sc.category_id === assetToEdit.category_id));
      } else {
        setForm(initialForm);
        setFilteredSubcategories([]);
      }
    }
  }, [isOpen, assetToEdit, subcategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'category_id') {
      setFilteredSubcategories(subcategories.filter(sc => sc.category_id === value));
      setForm(prev => ({ ...prev, subcategory_id: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = { ...form };
    
    // Asignar null a los campos opcionales si están vacíos
    if (!formData.subcategory_id) formData.subcategory_id = null;
    if (!formData.description) formData.description = null;
    if (!formData.brand) formData.brand = null;
    if (!formData.model) formData.model = null;
    if (!formData.serial_number) formData.serial_number = null;
    
    // Convertir el costo a un número antes de enviarlo
    const finalCost = parseFloat(formData.cost);
    formData.cost = isNaN(finalCost) ? 0.00 : finalCost;
    
    onSubmit({ id: assetToEdit?.id, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar' : 'Agregar'} Activo Fijo</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del Activo</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required>
              <option value="" disabled>Seleccionar categoría...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Subcategoría (Opcional)</label>
            <select name="subcategory_id" value={form.subcategory_id} onChange={handleChange} disabled={!form.category_id || filteredSubcategories.length === 0}>
              <option value="">{filteredSubcategories.length > 0 ? 'Seleccionar subcategoría...' : 'Sin subcategorías'}</option>
              {filteredSubcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Marca (Opcional)</label>
            <input name="brand" value={form.brand} onChange={handleChange} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Modelo (Opcional)</label>
            <input name="model" value={form.model} onChange={handleChange} />
          </div>
          
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Número de Serie (Opcional)</label>
            <input name="serial_number" value={form.serial_number} onChange={handleChange} />
          </div>

          {/* === NUEVO CAMPO DE COSTO === */}
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Costo / Valor (S/)</label>
            <input
              name="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 1500.50"
              value={form.cost}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Descripción (Opcional)</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}></textarea>
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