import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { Movement } from './MovimientosPage';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import type { ItfRate } from '../settings/ItfPage';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  movementToEdit: Movement | null;
  accounts: CompanyAccount[];
  itfRates: ItfRate[];
  isLoading: boolean;
}

const initialForm = {
  movement_date: new Date().toISOString().split('T')[0],
  movement_type: 'Transferencia',
  currency: 'PEN',
  amount: '',
  origin_account_id: '',
  destination_account_id: '',
  commission: '',
  description: '',
  apply_itf: false,
  movement_number: '',
  operation_number: ''
};

export const MovimientoFormModal = ({ isOpen, onClose, onSubmit, movementToEdit, accounts, itfRates, isLoading }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isEditMode = !!movementToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && movementToEdit) {
        setForm({
          ...initialForm,
          movement_date: movementToEdit.movement_date,
          description: movementToEdit.description || '',
          movement_type: movementToEdit.movement_type,
          amount: String(movementToEdit.amount),
          // @ts-ignore
          movement_number: movementToEdit.movement_number || '',
          // @ts-ignore
          operation_number: movementToEdit.operation_number || '',
        });
      } else {
        setForm(initialForm);
      }
      setVoucherFile(null);
    }
  }, [isOpen, movementToEdit, isEditMode]);

  // FILTRO CORREGIDO: Solo Bancos, misma moneda
  const filteredAccounts = useMemo(() =>
    accounts.filter(acc => 
        acc.currency === form.currency && 
        acc.account_type === 'BANCO' // <--- EXCLUIMOS CAJAS
    ), 
    [accounts, form.currency]
  );

  const itfAmount = useMemo(() => {
    if (!form.apply_itf || !form.amount) return 0;
    const amount = parseFloat(form.amount);
    const rate = itfRates.find(r => amount >= r.range_start && amount <= r.range_end);
    return rate ? Number(rate.fixed_amount) : 0;
  }, [form.apply_itf, form.amount, itfRates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const finalValue = type === 'checkbox' ? e.target.checked : value;
    setForm(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let voucherUrl = movementToEdit?.voucher_url || null;
    
    if (voucherFile) {
      const fileName = `${Date.now()}-${voucherFile.name}`;
      const { data, error } = await getSupabase().storage.from('movement-vouchers').upload(`public/${fileName}`, voucherFile);
      if (error) { toast.error(`Error al subir: ${error.message}`); setIsUploading(false); return; }
      voucherUrl = getSupabase().storage.from('movement-vouchers').getPublicUrl(data.path).data.publicUrl;
    }

    const submissionData = {
      p_movement_id: movementToEdit?.id,
      p_movement_date: form.movement_date,
      p_description: form.description || null,
      p_voucher_url: voucherUrl,
      p_movement_number: form.movement_number || null,
      p_operation_number: form.operation_number || null,
      p_amount: parseFloat(form.amount) 
    };

    if (!isEditMode) {
      Object.assign(submissionData, {
        p_movement_type: form.movement_type,
        p_currency: form.currency,
        p_amount: parseFloat(form.amount) || 0,
        p_commission: parseFloat(form.commission) || 0,
        p_itf_amount: itfAmount,
        p_origin_account_id: form.origin_account_id || null,
        p_destination_account_id: form.destination_account_id || null,
      });
    }
    
    onSubmit(submissionData);
    setIsUploading(false);
  };
  
  if (!isOpen) return null;

  const showOrigin = ['Transferencia', 'Retiro'].includes(form.movement_type);
  const showDestination = ['Transferencia', 'Depósito', 'Pago de Intereses'].includes(form.movement_type);
  const showCommissions = ['Transferencia', 'Retiro', 'Depósito'].includes(form.movement_type);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar' : 'Registrar'} Movimiento Bancario</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Tipo de Movimiento</label>
            <select name="movement_type" value={form.movement_type} onChange={handleChange} disabled={isEditMode}>
              <option>Transferencia</option>
              <option>Retiro</option>
              <option>Depósito</option>
              <option>Pago de Intereses</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Moneda</label>
            <select name="currency" value={form.currency} onChange={handleChange} disabled={isEditMode}>
              <option>PEN</option>
              <option>USD</option>
            </select>
          </div>
          
          {showOrigin && <div className={styles.inputGroup}>
            <label>Cuenta Origen</label>
            <select name="origin_account_id" value={form.origin_account_id} onChange={handleChange} required disabled={isEditMode}>
              <option value="">Seleccionar...</option>
              {filteredAccounts.map(a => <option key={a.id} value={a.id}>{`${a.bank_name} - ${a.account_number}`}</option>)}
            </select>
          </div>}
          
          {showDestination && <div className={styles.inputGroup}>
            <label>Cuenta Destino</label>
            <select name="destination_account_id" value={form.destination_account_id} onChange={handleChange} required disabled={isEditMode}>
              <option value="">Seleccionar...</option>
              {filteredAccounts.map(a => <option key={a.id} value={a.id}>{`${a.bank_name} - ${a.account_number}`}</option>)}
            </select>
          </div>}

          <div className={styles.inputGroup}>
            <label>Monto</label>
            <input name="amount" type="number" step="0.01" min="0.01" value={form.amount} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Fecha del Movimiento</label>
            <input name="movement_date" type="date" value={form.movement_date} onChange={handleChange} required />
          </div>

          {/* CAMPOS NUEVOS */}
          <div className={styles.inputGroup}>
            <label>N° Operación (Banco)</label>
            <input name="operation_number" value={form.operation_number} onChange={handleChange} placeholder="Ej: 123456" />
          </div>

          <div className={styles.inputGroup}>
            <label>N° Movimiento (Interno)</label>
            <input name="movement_number" value={form.movement_number} onChange={handleChange} placeholder="Ej: 3326" />
          </div>

          {showCommissions && <>
            <div className={styles.inputGroup}>
              <label>Comisión (Opcional)</label>
              <input name="commission" type="number" step="0.01" min="0" value={form.commission} onChange={handleChange} disabled={isEditMode} />
            </div>
            
            <div className={styles.inputGroup} style={{ alignItems: 'center', display: 'flex', paddingTop: '20px' }}>
              <input id="apply_itf" name="apply_itf" type="checkbox" checked={form.apply_itf} onChange={handleChange} disabled={isEditMode} style={{ width: 'auto', marginRight: '10px' }} />
              <label htmlFor="apply_itf" style={{ cursor: 'pointer', userSelect: 'none' }}>
                Aplica ITF (Cobro fijo: S/ {itfAmount.toFixed(2)})
              </label>
            </div>
          </>}

          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Descripción (Opcional)</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
          </div>

          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Comprobante (Opcional)</label>
            <input type="file" onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,image/*" />
            {movementToEdit?.voucher_url && !voucherFile && <small>Archivo actual: <a href={movementToEdit.voucher_url} target="_blank" rel="noreferrer">Ver</a></small>}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading || isUploading}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={isLoading || isUploading}>
              {isUploading ? 'Subiendo...' : isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};