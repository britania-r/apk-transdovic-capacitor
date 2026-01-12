import { useState } from 'react';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import formStyles from '../users/UserFormModal.module.css';

interface Props { details: PurchaseOrderDetails; }

export const AcInconformeSection = ({ details }: Props) => {
  const [justification, setJustification] = useState('');

  // Lógica para guardar la justificación iría aquí
  const handleSave = () => {
    alert(`Guardando justificación para la orden ${details.order_code}:\n\n${justification}`);
  };

  return (
    <div style={{padding: '1rem'}}>
      <h3>Registro de Acta Inconforme</h3>
      <div className={formStyles.inputGroup}>
        <label>Por favor, detalla el motivo de la inconformidad:</label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          className={formStyles.textarea}
          rows={8}
          placeholder="Ej: El producto llegó dañado, la cantidad es incorrecta, el servicio no cumple con lo acordado..."
        />
      </div>
      <div className={formStyles.actions}>
        <button onClick={handleSave} className={formStyles.submitButton}>Guardar Justificación</button>
      </div>
    </div>
  );
};