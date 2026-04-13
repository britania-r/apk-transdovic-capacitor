// File: apps/web/src/pages/purchases/PurchaseOrderFormModal.tsx
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import type { SupplierInList } from '../suppilers/SuppliersPage';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './PurchaseOrderFormModal.module.css';

export interface NewPurchaseOrderData {
  supplier_id?: string | null;
  order_type: 'Orden de Compra' | 'Orden de Servicio';
  with_quotation: boolean;
  status: 'ORDEN DE COMPRA' | 'REQUERIMIENTO';
  purchase_type: 'SOAT' | 'REVISIÓN TÉCNICA' | 'BOTIQUÍN' | 'EXTINTOR' | 'OTROS';
  currency: 'PEN' | 'USD';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewPurchaseOrderData) => void;
  suppliers: SupplierInList[];
  isLoading: boolean;
}

const PURCHASE_TYPE_OPTIONS = [
  { value: 'OTROS', label: 'Otros (Productos/Servicios)' },
  { value: 'SOAT', label: 'SOAT' },
  { value: 'REVISIÓN TÉCNICA', label: 'Revisión Técnica' },
  { value: 'BOTIQUÍN', label: 'Botiquín' },
  { value: 'EXTINTOR', label: 'Extintor' },
];

const ORDER_TYPE_OPTIONS = [
  { value: 'Orden de Compra', label: 'Orden de Compra' },
  { value: 'Orden de Servicio', label: 'Orden de Servicio y otros' },
];

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const QUOTATION_OPTIONS = [
  { value: 'false', label: 'No (Directo a Orden)' },
  { value: 'true', label: 'Sí (Inicia con Requerimiento)' },
];

const INITIAL = {
  order_type: 'Orden de Compra' as const,
  with_quotation: false,
  purchase_type: 'OTROS' as const,
  currency: 'PEN' as const,
  supplier_id: '',
};

export const PurchaseOrderFormModal = ({ isOpen, onClose, onSubmit, suppliers, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
    }
  }, [isOpen]);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({
      value: s.id,
      label: s.legal_name,
      sublabel: s.ruc,
    })),
    [suppliers]
  );

  const selectedSupplier = useMemo(() =>
    suppliers.find(s => s.id === form.supplier_id) || null,
    [suppliers, form.supplier_id]
  );

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleQuotationChange = (value: string) => {
    const isWithQuotation = value === 'true';
    setForm(prev => ({
      ...prev,
      with_quotation: isWithQuotation,
      supplier_id: isWithQuotation ? '' : prev.supplier_id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.with_quotation && !form.supplier_id) {
      toast.error('Para una orden sin cotización, debes seleccionar un proveedor');
      return;
    }

    const payload: NewPurchaseOrderData = {
      order_type: form.order_type as NewPurchaseOrderData['order_type'],
      with_quotation: form.with_quotation,
      purchase_type: form.purchase_type as NewPurchaseOrderData['purchase_type'],
      status: form.with_quotation ? 'REQUERIMIENTO' : 'ORDEN DE COMPRA',
      supplier_id: form.supplier_id || null,
      currency: form.currency as NewPurchaseOrderData['currency'],
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={`${formStyles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-cart"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Iniciar proceso de compra</h3>
              <p className={formStyles.modalSubtitle}>Configura los datos iniciales de la orden</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>

            {/* Tipo de compra + Tipo de orden */}
            <div className={formStyles.row}>
              <SimpleSelect
                label="Tipo de compra"
                options={PURCHASE_TYPE_OPTIONS}
                value={form.purchase_type}
                onChange={v => set('purchase_type', v)}
                required
              />
              <SimpleSelect
                label="Tipo de orden"
                options={ORDER_TYPE_OPTIONS}
                value={form.order_type}
                onChange={v => set('order_type', v)}
                required
              />
            </div>

            {/* Moneda + Cotización */}
            <div className={formStyles.row}>
              <SimpleSelect
                label="Moneda"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => set('currency', v)}
                required
              />
              <SimpleSelect
                label="¿Proceso con cotización?"
                options={QUOTATION_OPTIONS}
                value={String(form.with_quotation)}
                onChange={handleQuotationChange}
                required
              />
            </div>

            {/* Proveedor con búsqueda (solo si no es con cotización) */}
            {!form.with_quotation && (
              <SearchableSelect
                label="Proveedor"
                options={supplierOptions}
                value={form.supplier_id}
                onChange={v => set('supplier_id', v)}
                placeholder="Busca por razón social o RUC..."
                required
                emptyMessage="No se encontraron proveedores"
              />
            )}

            {/* Info del proveedor seleccionado */}
            {!form.with_quotation && selectedSupplier && (
              <div className={styles.supplierPreview}>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>R.U.C.</span>
                  <span className={styles.previewValue}>{selectedSupplier.ruc}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Dirección</span>
                  <span className={styles.previewValue}>{selectedSupplier.address || '—'}</span>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className={formStyles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={formStyles.cancelBtn}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={formStyles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Creando...</>
              ) : (
                <><i className="bx bx-right-arrow-alt"></i> Crear y continuar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};