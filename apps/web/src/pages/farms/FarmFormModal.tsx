// File: apps/web/src/pages/farms/FarmFormModal.tsx
import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { Farm, City, FarmWithCity } from './FarmsPage';
import styles from '../../components/ui/FormModal.module.css';
import mapStyles from './FarmFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Farm | Omit<Farm, 'id'>) => void;
  farmToEdit: FarmWithCity | null;
  isLoading: boolean;
  cities: City[];
}

const INITIAL: Omit<Farm, 'id'> = {
  name: '',
  ruc: '',
  city_id: '',
  address: '',
  notes: '',
  latitude: -8.11189,
  longitude: -79.02878,
  excel_formula: '',
};

export const FarmFormModal = ({ isOpen, onClose, onSubmit, farmToEdit, isLoading, cities }: Props) => {
  const [form, setForm] = useState<Omit<Farm, 'id'>>(INITIAL);
  const isEdit = !!farmToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (farmToEdit) {
      const { city_name, id, ...editableData } = farmToEdit;
      setForm(editableData);
    } else {
      setForm(INITIAL);
    }
  }, [isOpen, farmToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude') {
      setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      set(name, value);
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

  const cityOptions = cities.map(c => ({ value: c.id, label: c.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && farmToEdit) {
      onSubmit({ ...form, id: farmToEdit.id });
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
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-buildings'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar granja' : 'Nueva granja'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos de la granja' : 'Completa los datos y ubica la granja en el mapa'}
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

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre comercial <span className={styles.required}>*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Granja San José"
                  required
                  className={styles.input}
                />
              </div>

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
            </div>

            <div className={styles.row}>
              <SimpleSelect
                label="Ciudad"
                options={cityOptions}
                value={form.city_id}
                onChange={v => set('city_id', v)}
                placeholder="Seleccionar ciudad..."
                required
              />

              <div className={styles.field}>
                <label className={styles.label}>
                  Dirección <span className={styles.optional}>(referencial)</span>
                </label>
                <input
                  name="address"
                  value={form.address || ''}
                  onChange={handleChange}
                  placeholder="Ej. Km 5 Carretera Norte"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className={styles.field}>
              <label className={styles.label}>
                Observaciones <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Notas adicionales..."
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
                  mapId="transdovic-map-form"
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