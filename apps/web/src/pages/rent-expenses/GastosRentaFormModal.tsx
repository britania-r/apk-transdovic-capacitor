import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accounts: CompanyAccount[]; // Recibimos las cuentas para el selector
  isLoading: boolean;
}

const initialForm = {
  expense_date: new Date().toISOString().split('T')[0],
  document_type: 'Ticket de pago',
  document_number: '',
  has_igv: false,
  ruc: '',
  apply_to: '',
  concept: 'Peaje',
  detail: '',
  amount: '',
  payment_origin: 'BANCO', // 'BANCO' | 'CAJA_CHICA'
  origin_bank_account_id: '',
  currency: 'PEN', // Solo para Caja Chica
};

export const GastosRentaFormModal = ({ isOpen, onClose, onSubmit, accounts, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setVoucherFile(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const finalValue = type === 'checkbox' ? e.target.checked : value;
    setForm(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let voucherUrl = null;

    // 1. Subir Archivo (Si existe)
    if (voucherFile) {
      const fileName = `${Date.now()}-${voucherFile.name}`;
      const { data, error } = await getSupabase().storage
        .from('rent-expenses-vouchers')
        .upload(`public/${fileName}`, voucherFile);
        
      if (error) {
        toast.error(`Error al subir comprobante: ${error.message}`);
        setIsUploading(false);
        return;
      }
      
      const { data: urlData } = getSupabase().storage
        .from('rent-expenses-vouchers')
        .getPublicUrl(data.path);
      voucherUrl = urlData.publicUrl;
    }

    // 2. Preparar Datos para RPC
    const submissionData = {
      p_expense_date: form.expense_date,
      p_document_type: form.document_type,
      p_document_number: form.document_number,
      p_has_igv: form.has_igv,
      p_ruc: form.ruc || null,
      p_apply_to: form.apply_to || null,
      p_concept: form.concept,
      p_detail: form.detail || null,
      p_amount: parseFloat(form.amount),
      p_payment_origin: form.payment_origin,
      // Lógica condicional
      p_origin_bank_account_id: form.payment_origin === 'BANCO' ? form.origin_bank_account_id : null,
      p_currency: form.payment_origin === 'CAJA_CHICA' ? form.currency : null,
      p_voucher_url: voucherUrl
    };

    onSubmit(submissionData);
    setIsUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Registrar Gasto Renta</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* FECHA Y TIPO DOC */}
          <div className={styles.inputGroup}><label>Fecha</label><input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}>
            <label>Documento</label>
            <select name="document_type" value={form.document_type} onChange={handleChange}>
              <option>Ticket de pago</option>
              <option>Boleta electronica</option>
              <option>Recibo electronico</option>
              <option>Formulario 1683</option>
            </select>
          </div>

          {/* NUMERO Y RUC */}
          <div className={styles.inputGroup}><label>N° Documento</label><input name="document_number" value={form.document_number} onChange={handleChange} required /></div>
          <div className={styles.inputGroup}><label>RUC (Opcional)</label><input name="ruc" value={form.ruc} onChange={handleChange} /></div>

          {/* IGV Y APLICAR */}
          <div className={styles.inputGroup} style={{display:'flex', alignItems:'center', marginTop:'25px'}}>
            <input type="checkbox" name="has_igv" checked={form.has_igv} onChange={handleChange} style={{width:'auto', marginRight:'10px'}} />
            <label>Tiene IGV</label>
          </div>
          <div className={styles.inputGroup}><label>Aplicar a (Opcional)</label><input name="apply_to" value={form.apply_to} onChange={handleChange} placeholder="Placa / Área" /></div>

          {/* CONCEPTO Y MONTO */}
          <div className={styles.inputGroup}>
            <label>Concepto</label>
            <select name="concept" value={form.concept} onChange={handleChange}>
              <option>Peaje</option>
              <option>Sunat</option>
              <option>Otro</option>
            </select>
          </div>
          <div className={styles.inputGroup}><label>Importe Total</label><input type="number" name="amount" step="0.01" min="0.01" value={form.amount} onChange={handleChange} required /></div>

          {/* SECCIÓN ORIGEN DEL PAGO (IMPORTANTE) */}
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <label style={{color: '#2563eb', fontWeight: 'bold'}}>Origen del Pago</label>
            <select name="payment_origin" value={form.payment_origin} onChange={handleChange}>
              <option value="BANCO">Cuenta Bancaria</option>
              <option value="CAJA_CHICA">Caja Chica</option>
            </select>
          </div>

          {form.payment_origin === 'BANCO' ? (
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Seleccionar Banco</label>
              <select name="origin_bank_account_id" value={form.origin_bank_account_id} onChange={handleChange} required>
                <option value="">-- Seleccionar --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.banks?.name} - {acc.currency} - {acc.account_number}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Moneda de Caja Chica</label>
              <select name="currency" value={form.currency} onChange={handleChange}>
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          )}

          {/* DETALLE Y ARCHIVO */}
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Detalle</label><textarea name="detail" value={form.detail} onChange={handleChange} rows={2} /></div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Comprobante</label><input type="file" onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)} /></div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading || isUploading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading || isUploading}>{isUploading ? 'Subiendo...' : isLoading ? 'Guardando...' : 'Registrar Gasto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};