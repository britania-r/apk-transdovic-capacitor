// File: apps/web/src/pages/gas-stations/PeajeFormModal.tsx
import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
// CORRECCIÓN: Importamos el tipo desde el archivo de la página principal
import type { Peaje } from './PeajesPage'; 
import styles from '../../pages/users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // CORRECCIÓN: Usamos el tipo Peaje importado
  onSubmit: (data: Peaje | Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => void;
  peajeToEdit: Peaje | null;
  isLoading: boolean;
}

const initialFormData: Omit<Peaje, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  billing_frequency: 1,
  notes: '',
  latitude: -8.11189,
  longitude: -79.02878,
};

export const PeajeFormModal = ({ isOpen, onClose, onSubmit, peajeToEdit, isLoading }: Props) => {
  const [formData, setFormData] = useState(initialFormData);
  const isEditMode = !!peajeToEdit;

  useEffect(() => {
    if (isOpen) {
      if (peajeToEdit) {
        setFormData({
          name: peajeToEdit.name,
          billing_frequency: peajeToEdit.billing_frequency,
          notes: peajeToEdit.notes || '',
          latitude: peajeToEdit.latitude,
          longitude: peajeToEdit.longitude,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, peajeToEdit]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'billing_frequency') {
      setFormData(prev => ({...prev, [name]: parseInt(value, 10) }));
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
    if (isEditMode && peajeToEdit) {
      // CORRECCIÓN: Pasamos los campos que necesita el tipo Peaje
      onSubmit({ ...formData, id: peajeToEdit.id, created_at: peajeToEdit.created_at, updated_at: peajeToEdit.updated_at });
    } else {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  // El resto del JSX es idéntico y no necesita cambios...
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Peaje' : 'Crear Nuevo Peaje'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Nombre del Peaje</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Frecuencia de Cobro</label>
              <div className={styles.radioGroup}>
                <label><input type="radio" name="billing_frequency" value="1" checked={formData.billing_frequency === 1} onChange={handleChange} /> Cobra 1 vez</label>
                <label><input type="radio" name="billing_frequency" value="2" checked={formData.billing_frequency === 2} onChange={handleChange} /> Cobra 2 veces</label>
              </div>
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Notas</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className={styles.textarea} /></div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Ubicación en el Mapa</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem 0' }}>Arrastra el pin para ajustar la ubicación exacta. Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}</p>
              <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                <Map key={`${formData.latitude}-${formData.longitude}`} defaultCenter={{ lat: formData.latitude, lng: formData.longitude }} defaultZoom={15} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'transdovic-map-form-peajes'}>
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