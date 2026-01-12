// File: apps/web/src/pages/purchases/PurchaseOrderFormModal.tsx

import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import type { SupplierInList } from '../suppliers/SuppliersPage';
import styles from '../users/UserFormModal.module.css';

export interface NewPurchaseOrderData {
  supplier_id?: string | null;
  order_type: 'Orden de Compra' | 'Orden de Servicio';
  with_quotation: boolean;
  status: 'ORDEN DE COMPRA' | 'REQUERIMIENTO';
  purchase_type: 'SOAT' | 'REVISIÓN TÉCNICA' | 'BOTIQUÍN' | 'EXTINTOR' | 'OTROS';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewPurchaseOrderData) => void;
  suppliers: SupplierInList[];
  isLoading: boolean;
}

const initialFormData = {
  order_type: 'Orden de Compra' as const,
  with_quotation: false,
  purchase_type: 'OTROS' as const,
};

export const PurchaseOrderFormModal = ({ isOpen, onClose, onSubmit, suppliers, isLoading }: Props) => {
  const [formData, setFormData] = useState(initialFormData);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInList | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedSupplier(null);
    }
  }, [isOpen]);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s.id, label: s.legal_name, supplier: s })),
  [suppliers]);

  const handleSupplierChange = (selectedOption: any) => {
    setSelectedSupplier(selectedOption ? selectedOption.supplier : null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'with_quotation') {
      const isWithQuotation = value === 'true';
      setFormData(prev => ({ ...prev, with_quotation: isWithQuotation }));
      if (isWithQuotation) {
        setSelectedSupplier(null);
      }
    } else {
      // @ts-ignore
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // La validación del proveedor ahora aplica a todos los tipos de compra
    if (formData.with_quotation === false && !selectedSupplier) {
      toast.error('Para una orden sin cotización, debes seleccionar un proveedor.');
      return;
    }
    
    const payload: NewPurchaseOrderData = {
      order_type: formData.order_type,
      with_quotation: formData.with_quotation,
      purchase_type: formData.purchase_type,
      status: formData.with_quotation ? 'REQUERIMIENTO' : 'ORDEN DE COMPRA',
      supplier_id: selectedSupplier ? selectedSupplier.id : null,
    };
    
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <h3>Iniciar Proceso de Compra</h3>
        <form onSubmit={handleSubmit} className={styles.form} style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem 1.5rem' }}>
          
          {/* El Tipo de Compra ahora ocupa una sola columna */}
          <div className={styles.inputGroup}>
            <label>Tipo de Compra</label>
            <select name="purchase_type" value={formData.purchase_type} onChange={handleFormChange} required>
              <option value="OTROS">Otros (Productos/Servicios)</option>
              <option value="SOAT">SOAT</option>
              <option value="REVISIÓN TÉCNICA">Revisión Técnica</option>
              <option value="BOTIQUÍN">Botiquín</option>
              <option value="EXTINTOR">Extintor</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Tipo de Orden</label>
            <select name="order_type" value={formData.order_type} onChange={handleFormChange} required>
              <option value="Orden de Compra">Orden de Compra</option>
              <option value="Orden de Servicio">Orden de Servicio</option>
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label>¿Proceso con Cotización?</label>
            <select name="with_quotation" value={String(formData.with_quotation)} onChange={handleFormChange} required>
              <option value="false">No (Directo a Orden)</option>
              <option value="true">Sí (Inicia con Requerimiento)</option>
            </select>
          </div>
          
          {/* El selector de proveedor ahora se muestra siempre que no haya cotización */}
          {!formData.with_quotation && (
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', zIndex: 10 }}>
              <label>Seleccionar Proveedor (por Razón Social)</label>
              <Select
                options={supplierOptions}
                onChange={handleSupplierChange}
                placeholder="Busca y selecciona un proveedor..."
                isClearable
                autoFocus
              />
            </div>
          )}

          {selectedSupplier && !formData.with_quotation && (
            <>
              <div className={styles.inputGroup}><label>R.U.C.</label><input value={selectedSupplier.ruc} readOnly /></div>
              <div className={styles.inputGroup}><label>Dirección</label><input value={selectedSupplier.address || ''} readOnly /></div>
            </>
          )}

          <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};