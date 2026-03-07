// File: apps/web/src/pages/gas-stations/PeajeFormModal.tsx
import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Peaje } from './PeajesPage';
import styles from '../../components/ui/FormModal.module.css';
import mapStyles from './PeajeFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Peaje | Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => void;
  peajeToEdit: Peaje | null;
  isLoading: boolean;
}

const INITIAL: Omit<Peaje, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  billing_frequency: 1,
  notes: '',
  latitude: -8.11189,
  longitude: -79.02878,
};

export const PeajeFormModal = ({ isOpen, onClose, onSubmit, peajeToEdit, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const isEdit = !!peajeToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (peajeToEdit) {
      setForm({
        name: peajeToEdit.name,
        billing_frequency: peajeToEdit.billing_frequency,
        notes: peajeToEdit.notes || '',
        latitude: peajeToEdit.latitude,
        longitude: peajeToEdit.longitude,
      });
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, peajeToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude') {
      setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'billing_frequency') {
      setForm(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setForm(prev => ({
        ...prev,
        latitude: e.latLng!.lat(),
        longitude: e.latLng!.lng(),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && peajeToEdit) {
      onSubmit({
        ...form,
        id: peajeToEdit.id,
        created_at: peajeToEdit.created_at,
        updated_at: peajeToEdit.updated_at,
      });
    } else {
      onSubmit(form);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${mapStyles.wideModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-map-pin'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar peaje' : 'Nuevo peaje'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del peaje' : 'Completa los datos y ubica el peaje en el mapa'}
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
                Nombre del peaje <span className={styles.required}>*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej. Peaje Chicama"
                required
                className={styles.input}
              />
            </div>

            {/* Frecuencia de cobro — radios */}
            <div className={styles.field}>
              <label className={styles.label}>
                Frecuencia de cobro <span className={styles.required}>*</span>
              </label>
              <div className={mapStyles.radioGroup}>
                <label className={`${mapStyles.radioOption} ${form.billing_frequency === 1 ? mapStyles.radioActive : ''}`}>
                  <input
                    type="radio"
                    name="billing_frequency"
                    value="1"
                    checked={form.billing_frequency === 1}
                    onChange={handleChange}
                  />
                  <i className="bx bx-check-circle"></i>
                  Cobra 1 vez
                </label>
                <label className={`${mapStyles.radioOption} ${form.billing_frequency === 2 ? mapStyles.radioActive : ''}`}>
                  <input
                    type="radio"
                    name="billing_frequency"
                    value="2"
                    checked={form.billing_frequency === 2}
                    onChange={handleChange}
                  />
                  <i className="bx bx-check-circle"></i>
                  Cobra 2 veces
                </label>
              </div>
            </div>

            {/* Notas */}
            <div className={styles.field}>
              <label className={styles.label}>
                Notas <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Observaciones adicionales..."
                className={styles.input}
              />
            </div>

            {/* Mapa */}
            <div className={styles.field}>
              <label className={styles.label}>Ubicación en el mapa</label>
              <p className={mapStyles.mapHint}>
                Arrastra el pin para ajustar la ubicación.
                Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
              </p>
              <div className={mapStyles.mapContainer}>
                <Map
                  key={`${form.latitude}-${form.longitude}`}
                  defaultCenter={{ lat: form.latitude, lng: form.longitude }}
                  defaultZoom={15}
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                  mapId="transdovic-map-form-peajes"
                >
                  <AdvancedMarker
                    position={{ lat: form.latitude, lng: form.longitude }}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                  />
                </Map>
              </div>
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