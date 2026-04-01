// File: apps/web/src/pages/purchases/ChangeStatusModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import formStyles from '../../components/ui/FormModal.module.css';

const fullWorkflowTransitions: Record<string, string[]> = {
  'REQUERIMIENTO': ['COTIZACIÓN'],
  'COTIZACIÓN': ['PENDIENTE'],
  'PENDIENTE': ['ORDEN DE COMPRA', 'ORDEN DE SERVICIO'],
  'ORDEN DE COMPRA': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ORDEN DE SERVICIO': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ACTA DE CONFORMIDAD': ['PAGO PENDIENTE'],
  'PAGO PENDIENTE': ['FACTURA PAGADA'],
};

const directPurchaseTransitions: Record<string, string[]> = {
  'ORDEN DE COMPRA': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ORDEN DE SERVICIO': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ACTA DE CONFORMIDAD': ['PAGO PENDIENTE'],
  'PAGO PENDIENTE': ['FACTURA PAGADA'],
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newStatus: string) => void;
  currentStatus: string;
  orderType: string;
  withQuotation: boolean;
  isLoading: boolean;
}

export const ChangeStatusModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentStatus,
  orderType,
  withQuotation,
  isLoading,
}: Props) => {
  const [newStatus, setNewStatus] = useState('');

  const possibleNextStates = useMemo(() => {
    if (withQuotation) {
      if (currentStatus === 'PENDIENTE') return [orderType.toUpperCase()];
      return fullWorkflowTransitions[currentStatus] || [];
    }
    return directPurchaseTransitions[currentStatus] || [];
  }, [currentStatus, orderType, withQuotation]);

  const statusOptions = useMemo(() =>
    possibleNextStates.map(s => ({ value: s, label: s })),
    [possibleNextStates]
  );

  useEffect(() => {
    if (isOpen && possibleNextStates.length > 0) {
      setNewStatus(possibleNextStates[0]);
    } else if (isOpen) {
      setNewStatus('');
    }
  }, [isOpen, possibleNextStates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus) onSubmit(newStatus);
  };

  if (!isOpen) return null;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={formStyles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className="bx bx-transfer-alt"></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>Actualizar estado</h3>
              <p className={formStyles.modalSubtitle}>Cambia el estado de la orden de compra</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Estado actual</label>
              <input
                value={currentStatus}
                readOnly
                disabled
                className={`${formStyles.input} ${formStyles.inputDisabled}`}
              />
            </div>

            {possibleNextStates.length > 0 ? (
              <SimpleSelect
                label="Nuevo estado"
                options={statusOptions}
                value={newStatus}
                onChange={setNewStatus}
                required
              />
            ) : (
              <div className={formStyles.field}>
                <label className={formStyles.label}>Nuevo estado</label>
                <input
                  value="No hay más transiciones disponibles"
                  readOnly
                  disabled
                  className={`${formStyles.input} ${formStyles.inputDisabled}`}
                />
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
              disabled={isLoading || possibleNextStates.length === 0}
            >
              {isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Actualizando...</>
              ) : (
                <><i className="bx bx-check"></i> Actualizar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};