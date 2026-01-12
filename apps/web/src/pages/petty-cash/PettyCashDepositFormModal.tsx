import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PettyCashTransaction } from './PettyCashPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  transactionToEdit: PettyCashTransaction | null;
}

const initialForm = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  currency: 'PEN',
  description: '',
  document_number: '',
  detail: ''
};

export const PettyCashDepositFormModal = ({ isOpen, onClose, onSubmit, isLoading, transactionToEdit }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setForm({
          date: transactionToEdit.transaction_date,
          amount: String(transactionToEdit.amount),
          currency: transactionToEdit.currency,
          description: transactionToEdit.description || '',
          document_number: transactionToEdit.document_number || '',
          detail: transactionToEdit.detail || ''
        });
      } else {
        setForm(initialForm);
      }
      setVoucherFile(null);
    }
  }, [isOpen, transactionToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let voucherUrl = transactionToEdit?.voucher_url || null;

    if (voucherFile) {
      const fileName = `${Date.now()}-${voucherFile.name}`;
      const { data, error } = await getSupabase().storage
        .from('petty-cash-vouchers')
        .upload(`public/${fileName}`, voucherFile);
        
      if (error) {
        toast.error(`Error al subir: ${error.message}`);
        setIsUploading(false);
        return;
      }
      
      const { data: urlData } = getSupabase().storage
        .from('petty-cash-vouchers')
        .getPublicUrl(data.path);
        
      voucherUrl = urlData.publicUrl;
    }
    
    onSubmit({
      id: transactionToEdit?.id,
      date: form.date,
      amount: parseFloat(form.amount),
      currency: form.currency,
      description: form.description || null,
      document_number: form.document_number || null,
      detail: form.detail || null,
      voucherUrl,
    });
    setIsUploading(false);
  };

  if (!isOpen) return null;
  const totalLoading = isLoading || isUploading;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar' : 'Registrar'} Ingreso a Caja Chica</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.inputGroup}>
            <label>Fecha</label>
            <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required/>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Moneda</label>
            <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} disabled={isEditMode}>
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>N° Documento / Operación</label>
            <input type="text" value={form.document_number} onChange={(e) => setForm({...form, document_number: e.target.value})} placeholder="Ej. Op-123456" />
          </div>

          <div className={styles.inputGroup}>
            <label>Monto</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required disabled={isEditMode}/>
          </div>

          <div className={styles.inputGroup} style={{gridColumn: '1 / -1'}}>
            <label>Descripción Principal</label>
            <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Ej. Reposición Semanal" />
          </div>

          <div className={styles.inputGroup} style={{gridColumn: '1 / -1'}}>
            <label>Detalle Adicional</label>
            <textarea value={form.detail} onChange={(e) => setForm({...form, detail: e.target.value})} rows={2} placeholder="Detalles extra..." />
          </div>

          <div className={styles.inputGroup} style={{gridColumn: '1 / -1'}}>
            <label>Comprobante (Opcional)</label>
            <input type="file" onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)} />
            {isEditMode && transactionToEdit.voucher_url && <small>Archivo actual: <a href={transactionToEdit.voucher_url} target="_blank" rel="noreferrer">Ver</a></small>}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={totalLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={totalLoading}>
              {isUploading ? 'Subiendo...' : isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};