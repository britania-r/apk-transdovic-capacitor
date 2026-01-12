// File: apps/web/src/pages/suppliers/SupplierFormModal.tsx

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { SupplierInList } from './SuppliersPage'; // Usamos este tipo para la edición
import type { City } from '../settings/CitiesPage'; // Importamos tipos de otras páginas
import type { Category } from '../settings/CategoriesPage';
import styles from '../users/UserFormModal.module.css';

// El tipo de dato que maneja el formulario internamente
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

const initialFormData: SupplierFormData = {
  trade_name: '',
  legal_name: '',
  ruc: '',
  address: '',
  description: '',
  city_id: '',
  category_id: '',
};

export const SupplierFormModal = ({ isOpen, onClose, onSubmit, supplierToEdit, cities, categories, isLoading }: Props) => {
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const isEditMode = !!supplierToEdit;

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        // Nota: Para la edición, necesitaríamos los IDs, no los nombres.
        // Esto requerirá un ajuste en la query o pasar el objeto completo.
        // Por ahora, asumimos que tenemos los IDs.
        setFormData({
          trade_name: supplierToEdit.trade_name,
          legal_name: supplierToEdit.legal_name,
          ruc: supplierToEdit.ruc,
          address: '', // Estos campos no vienen en la lista, se cargarían en un get por ID
          description: '',
          city_id: '', // Se necesitaría el city_id del proveedor
          category_id: '', // Se necesitaría el category_id del proveedor
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, supplierToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trade_name || !formData.legal_name || !formData.ruc) {
      toast.error('Nombre Comercial, Razón Social y RUC son obligatorios.');
      return;
    }
    onSubmit({ id: supplierToEdit?.id, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}><label>Nombre Comercial</label><input name="trade_name" value={formData.trade_name} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}><label>Razón Social</label><input name="legal_name" value={formData.legal_name} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}><label>R.U.C.</label><input name="ruc" value={formData.ruc} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}><label>Dirección</label><input name="address" value={formData.address} onChange={handleChange} /></div>
          <div className={styles.inputGroup}><label>Ciudad</label>
            <select name="city_id" value={formData.city_id} onChange={handleChange}>
              <option value="">Seleccionar ciudad...</option>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className={styles.inputGroup}><label>Categoría</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Seleccionar categoría...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className={styles.textarea} rows={3} />
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