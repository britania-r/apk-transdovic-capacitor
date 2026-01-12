// File: apps/web/src/pages/farms/FarmFormModal.tsx
import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Farm, City, FarmWithCity } from './FarmsPage'; 
import styles from '../../pages/users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Farm | Omit<Farm, 'id'>) => void;
  farmToEdit: FarmWithCity | null;
  isLoading: boolean;
  cities: City[];
}

const initialFormData: Omit<Farm, 'id'> = {
  name: '', ruc: '', city_id: '', address: '', notes: '',
  latitude: -8.11189, longitude: -79.02878,
  excel_formula: '',
};

export const FarmFormModal = ({ isOpen, onClose, onSubmit, farmToEdit, isLoading, cities }: Props) => {
  const [formData, setFormData] = useState<Omit<Farm, 'id'>>(initialFormData);
  const isEditMode = !!farmToEdit;

  useEffect(() => {
    if (isOpen) {
      if (farmToEdit) {
        const { city_name, ...editableFarmData } = farmToEdit;
        setFormData(editableFarmData);
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, farmToEdit]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setFormData(prev => ({ ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && farmToEdit) {
      onSubmit({ ...formData, id: farmToEdit.id });
    } else {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Granja' : 'Crear Nueva Granja'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}><label>Nombre Comercial</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className={styles.inputGroup}><label>RUC</label><input name="ruc" value={formData.ruc} onChange={handleChange} required /></div>
            <div className={styles.inputGroup}><label>Ciudad</label>
              <select name="city_id" value={formData.city_id} onChange={handleChange} required>
                <option value="" disabled>Selecciona una ciudad</option>
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}><label>Dirección (Referencial)</label><input name="address" value={formData.address || ''} onChange={handleChange} /></div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Observaciones</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className={styles.textarea} /></div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Fórmula de Conversión</label><textarea name="excel_formula" value={formData.excel_formula || ''} onChange={handleChange} rows={2} placeholder="Ej: X + 81 + COCIENTE(X+19;39)" className={styles.textarea} /></div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Ubicación en el Mapa</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem 0' }}>Arrastra el pin para ajustar la ubicación exacta. Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}</p>
              <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                <Map key={`${formData.latitude}-${formData.longitude}`} defaultCenter={{ lat: formData.latitude, lng: formData.longitude }} defaultZoom={15} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'transdovic-map-form'}>
                  <AdvancedMarker position={{ lat: formData.latitude, lng: formData.longitude }} draggable={true} onDragEnd={handleMarkerDragEnd} />
                </Map>
              </div>
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