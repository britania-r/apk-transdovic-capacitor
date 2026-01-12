// File: apps/web/src/pages/purchases/ChangeStatusModal.tsx

import { useState, useEffect, useMemo } from 'react';
import styles from '../users/UserFormModal.module.css';

// --- NUEVA LÓGICA DE WORKFLOW ---
const fullWorkflowTransitions = {
  'REQUERIMIENTO': ['COTIZACIÓN'],
  'COTIZACIÓN': ['PENDIENTE'],
  'PENDIENTE': ['ORDEN DE COMPRA', 'ORDEN DE SERVICIO'], // Puede ser cualquiera de los dos
  'ORDEN DE COMPRA': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ORDEN DE SERVICIO': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ACTA DE CONFORMIDAD': ['PAGO PENDIENTE'],
  'PAGO PENDIENTE': ['FACTURA PAGADA'],
};

const directPurchaseTransitions = {
  'ORDEN DE COMPRA': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ORDEN DE SERVICIO': ['AC INCONFORME', 'ACTA DE CONFORMIDAD'],
  'ACTA DE CONFORMIDAD': ['PAGO PENDIENTE'],
  'PAGO PENDIENTE': ['FACTURA PAGADA'],
};

// --- CAMBIO: La interfaz de Props ahora necesita más contexto ---
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newStatus: string) => void;
  currentStatus: string;
  orderType: string;
  withQuotation: boolean;
  isLoading: boolean;
}

export const ChangeStatusModal = ({ isOpen, onClose, onSubmit, currentStatus, orderType, withQuotation, isLoading }: Props) => {
  const [newStatus, setNewStatus] = useState('');

  // --- CAMBIO: 'possibleNextStates' ahora se calcula dinámicamente ---
  const possibleNextStates = useMemo(() => {
    if (withQuotation) {
      // Para órdenes con cotización, usamos el flujo completo
      // Caso especial: Desde PENDIENTE, solo mostrar el tipo de orden correcto
      if (currentStatus === 'PENDIENTE') {
        return [orderType];
      }
      return fullWorkflowTransitions[currentStatus] || [];
    } else {
      // Para órdenes directas, usamos el flujo corto
      return directPurchaseTransitions[currentStatus] || [];
    }
  }, [currentStatus, orderType, withQuotation]);

  useEffect(() => {
    if (isOpen && possibleNextStates.length > 0) {
      setNewStatus(possibleNextStates[0]);
    } else if (isOpen) {
      setNewStatus('');
    }
  }, [isOpen, possibleNextStates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus) {
      onSubmit(newStatus);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>Actualizar Estado de la Orden</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Estado Actual</label>
            <input value={currentStatus} readOnly disabled />
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Seleccionar Nuevo Estado</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required disabled={possibleNextStates.length === 0}>
              {possibleNextStates.length > 0 ? (
                possibleNextStates.map(status => <option key={status} value={status}>{status}</option>)
              ) : (
                <option>No hay más transiciones disponibles</option>
              )}
            </select>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading || possibleNextStates.length === 0}>
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};