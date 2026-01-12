import { useState, useMemo } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import styles from '../users/UserFormModal.module.css';
import customReactSelectStyles from '../../styles/customReactSelectStyles';

export const QuotationFormModal = ({ isOpen, onClose, onSubmit, suppliers, isLoading }) => {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: s.id, label: s.legal_name })), [suppliers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierId || !file) {
      toast.error('Debes seleccionar un proveedor y adjuntar un archivo.');
      return;
    }
    onSubmit({ supplier_id: supplierId, file });
  };

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Adjuntar Nueva Cotización</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup} style={{zIndex: 10}}><label>Proveedor</label>
            <Select options={supplierOptions} onChange={opt => setSupplierId(opt ? opt.value : null)} styles={customReactSelectStyles} placeholder="Seleccionar proveedor..." isClearable />
          </div>
          <div className={styles.inputGroup}><label>Archivo de Cotización (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className={styles.input} required />
          </div>
          <div className={styles.actions}><button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button><button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </div>
    </div>
  );
};