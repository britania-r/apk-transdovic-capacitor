import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import type { IncomeRecord } from './IngresosPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accounts: CompanyAccount[];
  isLoading: boolean;
  incomeToEdit: IncomeRecord | null;
}

const initialForm = {
  income_type: 'Factura Única',
  income_date: new Date().toISOString().split('T')[0],
  amount: '',
  payment_type: 'Transferencia',
  destination_account_id: '',
  reference_number: '',
  operation_number: '',
  movement_number: '',
  description: '',
};

export const IngresoFormModal = ({ isOpen, onClose, onSubmit, accounts, isLoading, incomeToEdit }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isEditMode = !!incomeToEdit;

  // AJUSTE: Filtramos solo cuentas que sean PEN y además sean BANCOS (excluyendo cajas)
  const solesAccounts = useMemo(() => {
    return accounts.filter(acc => acc.currency === 'PEN' && acc.account_type === 'BANCO');
  }, [accounts]);

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        // MODO EDICIÓN
        setForm({
          income_type: incomeToEdit.income_type,
          income_date: incomeToEdit.income_date,
          amount: String(incomeToEdit.amount),
          // @ts-ignore
          payment_type: incomeToEdit.payment_type,
          destination_account_id: incomeToEdit.destination_account_id || '',
          reference_number: incomeToEdit.reference_number || '',
          operation_number: incomeToEdit.operation_number || '',
          movement_number: incomeToEdit.movement_number || '',
          description: incomeToEdit.description || '',
        });
      } else {
        // MODO CREACIÓN
        setForm(initialForm);
      }
      setInvoiceFile(null);
    }
  }, [isOpen, incomeToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    let invoiceUrl = incomeToEdit?.invoice_url || null;

    if (form.income_type === 'Factura Única') {
      if (!isEditMode && !invoiceFile) {
        toast.error('Debes adjuntar el comprobante para una "Factura Única".');
        setIsUploading(false);
        return;
      }

      if (invoiceFile) {
        const fileName = `${Date.now()}-${invoiceFile.name}`;
        const { data, error } = await getSupabase().storage.from('income-invoices').upload(`public/${fileName}`, invoiceFile);
        if (error) { toast.error(`Error al subir: ${error.message}`); setIsUploading(false); return; }
        invoiceUrl = getSupabase().storage.from('income-invoices').getPublicUrl(data.path).data.publicUrl;
      }
    }

    const submissionData = {
      p_income_date: form.income_date,
      p_amount: parseFloat(form.amount),
      p_payment_type: form.payment_type,
      p_destination_account_id: form.destination_account_id,
      p_income_type: form.income_type,
      p_reference_number: form.income_type === 'Factura Única' ? form.reference_number || null : null,
      p_invoice_url: invoiceUrl,
      p_description: form.description || null,
      p_operation_number: form.operation_number || null,
      p_movement_number: form.movement_number || null,
    };
    
    onSubmit(submissionData);
    setIsUploading(false);
  };

  if (!isOpen) return null;
  const totalLoading = isLoading || isUploading;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Tipo de Registro</label>
            <select name="income_type" value={form.income_type} onChange={handleChange} disabled={isEditMode}>
              <option value="Factura Única">Factura Única</option>
              <option value="Varias Facturas">Varias Facturas</option>
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Fecha del Ingreso</label>
            <input name="income_date" type="date" value={form.income_date} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Monto Total (S/)</label>
            <input name="amount" type="number" step="0.01" min="0.01" value={form.amount} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Cuenta de Destino {isEditMode && '(No editable)'}</label>
            <select 
                name="destination_account_id" 
                value={form.destination_account_id} 
                onChange={handleChange} 
                required
                disabled={isEditMode}
                style={isEditMode ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
            >
              <option value="" disabled>Seleccionar...</option>
              {solesAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.account_number}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Tipo de Pago</label>
            <select name="payment_type" value={form.payment_type} onChange={handleChange} required>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Bancarizacion">Bancarizacion</option>
              <option value="Abono por devolución">Abono por devolución</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>N° de Operación (Banco)</label>
            <input name="operation_number" value={form.operation_number} onChange={handleChange} />
          </div>

          <div className={styles.inputGroup}>
            <label>N° de Movimiento (Interno)</label>
            <input 
              name="movement_number" 
              value={form.movement_number} 
              onChange={handleChange} 
              placeholder="Ej: 3326"
            />
          </div>

          {form.income_type === 'Factura Única' && (
            <>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>N° de Factura (Opcional)</label>
                <input name="reference_number" value={form.reference_number} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Adjuntar Comprobante {isEditMode && '(Dejar vacío para mantener actual)'}</label>
                <input 
                    type="file" 
                    onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)} 
                    accept=".pdf,image/*" 
                    required={!isEditMode}
                />
                {isEditMode && incomeToEdit?.invoice_url && !invoiceFile && (
                    <small style={{ display: 'block', marginTop: '5px' }}>
                        Archivo actual: <a href={incomeToEdit.invoice_url} target="_blank" rel="noreferrer">Ver Documento</a>
                    </small>
                )}
              </div>
            </>
          )}

          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Descripción (Opcional)</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={totalLoading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={totalLoading}>
              {isUploading ? 'Subiendo...' : isLoading ? (isEditMode ? 'Guardando...' : 'Registrando...') : (isEditMode ? 'Guardar Cambios' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};