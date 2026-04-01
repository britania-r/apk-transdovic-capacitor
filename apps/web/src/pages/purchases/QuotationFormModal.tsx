// File: apps/web/src/pages/purchases/QuotationFormModal.tsx
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import type { SupplierInList } from '../suppilers/SuppliersPage';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './QuotationFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { supplier_id: string; file: File }) => void;
  suppliers: SupplierInList[];
  isLoading: boolean;
}

export const QuotationFormModal = ({ isOpen, onClose, onSubmit, suppliers, isLoading }: Props) => {
  const [supplierId, setSupplierId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSupplierId('');
      setFile(null);
    }
  }, [isOpen]);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s.id, label: s.legal_name, sublabel: s.ruc })),
    [suppliers]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !file) {
      toast.error('Selecciona un proveedor y adjunta un archivo');
      return;
    }
    onSubmit({ supplier_id: supplierId, file });
  };

  if (!isOpen) return null;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={formStyles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-file-find"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Adjuntar cotización</h3>
              <p className={formStyles.modalSubtitle}>Selecciona el proveedor y sube el archivo PDF</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>
            <SearchableSelect
              label="Proveedor"
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Busca por razón social o RUC..."
              required
            />

            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Archivo de cotización <span className={formStyles.required}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                className={styles.fileInput}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={formStyles.modalFooter}>
            <button type="button" onClick={onClose} className={formStyles.cancelBtn} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className={formStyles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Subiendo...</>
              ) : (
                <><i className="bx bx-upload"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};