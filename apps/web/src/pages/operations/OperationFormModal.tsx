import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import type { Operation, OperationType, DepositSubtype, DocType, ConceptType } from './hooks/useOperations';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  isLoading: boolean;
  opToEdit: Operation | null;
  accounts: CompanyAccount[];
}

const initialForm = {
  operation_date: new Date().toISOString().split('T')[0],
  operation_type: 'GASTO' as OperationType,
  account_id: '',
  amount: '',
  currency: 'PEN',
  detail: '',
  movement_number: '',  // N° Banco (Conciliación)
  operation_number: '', // N° Voucher Global
  
  deposit_subtype: 'TRANSFERENCIA' as DepositSubtype,
  destination_account_id: '',
  doc_type: 'Ticket de pago' as DocType,
  doc_number: '',       // N° Factura (Solo si es simple)
  has_igv: false,
  concept: 'Otro' as ConceptType,
  apply_to: '',
  
  is_multiple: false
};

export const OperationFormModal = ({ isOpen, onClose, onSuccess, isLoading, opToEdit, accounts }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const isEdit = !!opToEdit;

  // Filtrar cuentas (Solo Bancos)
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
        acc.account_type === 'BANCO' && 
        acc.currency === form.currency
    );
  }, [accounts, form.currency]);

  useEffect(() => {
    if (isOpen) {
      if (opToEdit) {
        setForm({
            operation_date: opToEdit.operation_date,
            operation_type: opToEdit.operation_type,
            account_id: opToEdit.account_id,
            amount: String(opToEdit.amount || 0),
            currency: opToEdit.currency,
            detail: opToEdit.detail || '',
            movement_number: opToEdit.movement_number || '',
            operation_number: opToEdit.operation_number || '',
            deposit_subtype: opToEdit.deposit_subtype || 'TRANSFERENCIA',
            destination_account_id: opToEdit.destination_account_id || '',
            doc_type: opToEdit.document_type || 'Ticket de pago',
            doc_number: opToEdit.document_number || '',
            has_igv: opToEdit.has_igv || false,
            concept: opToEdit.concept || 'Otro',
            apply_to: opToEdit.apply_to || '',
            is_multiple: opToEdit.is_multiple
        });
      } else {
        setForm({
            ...initialForm,
            operation_date: new Date().toISOString().split('T')[0]
        });
      }
      setVoucherFile(null);
    }
  }, [isOpen, opToEdit]);

  const isDeposit = form.operation_type === 'DEPOSITO';
  const isTransfer = form.operation_type === 'TRANSFERENCIA';
  const isExpenseOrPayment = ['GASTO', 'PAGO'].includes(form.operation_type);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'checkbox' ? e.target.checked : value;

    if (name === 'currency' && value !== form.currency) {
        setForm(prev => ({ ...prev, [name]: val, account_id: '', destination_account_id: '' }));
    } else {
        setForm(prev => ({ ...prev, [name]: val }));
    }
  };

  // --- LIMPIEZA DE DATOS (Fix Error 404) ---
  const cleanData = (rawData: any) => {
    const cleaned: any = {};
    for (const key in rawData) {
        const value = rawData[key];
        if (typeof value === 'string' && value.trim() === '') {
            cleaned[key] = null;
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.account_id) {
        toast.error("Selecciona una cuenta bancaria");
        return;
    }

    setIsUploading(true);

    try {
        const supabase = getSupabase();
        let voucherUrl = opToEdit?.voucher_url || null;

        // 1. Subir archivo (Solo si NO es múltiple)
        if (voucherFile && !form.is_multiple) {
            const fileName = `op-${Date.now()}-${voucherFile.name}`;
            const { data, error } = await supabase.storage
                .from('operation-evidences')
                .upload(`public/${fileName}`, voucherFile);
            
            if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
            
            const { data: urlData } = supabase.storage
                .from('operation-evidences')
                .getPublicUrl(data.path);
            voucherUrl = urlData.publicUrl;
        }

        // 2. Preparar Payload
        const payload = {
            p_id: opToEdit?.id || null,
            p_date: form.operation_date,
            p_type: form.operation_type,
            p_account_id: form.account_id,
            // Si es múltiple, monto inicial es 0 (se suma en detalle)
            p_amount: (form.is_multiple && !isEdit) ? 0 : parseFloat(form.amount || '0'),
            p_currency: form.currency,
            p_is_multiple: form.is_multiple,
            
            p_detail: form.detail,
            p_movement_number: form.movement_number,   // N° Banco
            p_operation_number: form.operation_number, // N° Voucher Global
            p_voucher_url: voucherUrl,
            
            // Condicionales
            p_deposit_subtype: isDeposit ? form.deposit_subtype : null,
            p_destination_account_id: isTransfer ? form.destination_account_id : null,
            
            p_document_type: isExpenseOrPayment ? form.doc_type : null,
            // Si es múltiple, el N° Factura va en el detalle, aquí null
            p_document_number: (!form.is_multiple && (isExpenseOrPayment || isDeposit)) ? form.doc_number : null,
            
            p_has_igv: isExpenseOrPayment ? form.has_igv : false,
            p_apply_to: isExpenseOrPayment ? form.apply_to : null,
            p_concept: isExpenseOrPayment ? form.concept : null,
            
            p_entity_name: null,
            p_details_json: null
        };

        const cleanPayload = cleanData(payload);
        
        // 3. Llamar al Success (que invoca al RPC en el padre)
        onSuccess(cleanPayload);
        
        // 4. Redirección Hack (Idealmente esperaríamos el ID, pero asumimos flujo rápido)
        // Nota: El padre (OperationsPage) debería manejar esto si tuviéramos el ID retornado.
        // Como 'onSuccess' es void aquí, confiamos en que el usuario irá al detalle desde la tabla
        // O implementaremos la redirección en el padre.

    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{isEdit ? 'Editar Operación' : 'Registrar Operación'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* 1. TIPO Y FECHA */}
            <div className={styles.inputGroup}>
                <label>Tipo</label>
                <select name="operation_type" value={form.operation_type} onChange={handleChange} disabled={isEdit}>
                    <option value="GASTO">GASTO</option>
                    <option value="DEPOSITO">DEPOSITO</option>
                    <option value="RETIRO">RETIRO</option>
                    <option value="PAGO">PAGO</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                </select>
            </div>
            <div className={styles.inputGroup}>
                <label>Fecha</label>
                <input type="date" name="operation_date" value={form.operation_date} onChange={handleChange} required />
            </div>

            {/* 2. CHECKBOX MÚLTIPLE (VISIBLE SIEMPRE EXCEPTO TRANSFERENCIA SIMPLE) */}
            {!isTransfer && (
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input 
                            type="checkbox" 
                            name="is_multiple" 
                            checked={form.is_multiple} 
                            onChange={handleChange} 
                            style={{ width: 'auto', marginRight: '10px', cursor:'pointer' }} 
                        />
                        <label style={{ fontWeight: 'bold', color: '#2563eb', cursor:'pointer' }}>
                            Tiene múltiples facturas / items
                        </label>
                    </div>
                    {form.is_multiple && (
                        <small style={{display:'block', marginTop:'5px', color:'#6b7280'}}>
                            Se creará la operación y serás redirigido para cargar los detalles uno a uno.
                        </small>
                    )}
                </div>
            )}

            {/* 3. MONEDA Y CUENTA */}
            <div className={styles.inputGroup}>
                <label>Moneda</label>
                <select name="currency" value={form.currency} onChange={handleChange} disabled={isEdit}>
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                </select>
            </div>
            <div className={styles.inputGroup}>
                <label>{isDeposit ? 'Cuenta Destino' : 'Cuenta Origen'}</label>
                <select name="account_id" value={form.account_id} onChange={handleChange} required>
                    <option value="">-- Seleccionar Banco --</option>
                    {filteredAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.bank_name} {a.currency} - {a.account_number}
                        </option>
                    ))}
                </select>
            </div>

            {/* CAMPOS CONDICIONALES */}
            {isTransfer && (
                <div className={styles.inputGroup}>
                    <label>Cuenta Destino</label>
                    <select name="destination_account_id" value={form.destination_account_id} onChange={handleChange} required>
                        <option value="">-- Seleccionar Banco --</option>
                        {filteredAccounts.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.bank_name} {a.currency} - {a.account_number}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {isDeposit && (
                <div className={styles.inputGroup}>
                    <label>Subtipo</label>
                    <select name="deposit_subtype" value={form.deposit_subtype} onChange={handleChange}>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="BANCARIZACION">Bancarización</option>
                        <option value="VENTANILLA">Ventanilla</option>
                    </select>
                </div>
            )}

            {/* CAMPOS DE FACTURA (SOLO SI NO ES MÚLTIPLE) */}
            {!form.is_multiple && isExpenseOrPayment && (
                <>
                    <div className={styles.inputGroup}>
                        <label>Tipo Doc.</label>
                        <select name="doc_type" value={form.doc_type} onChange={handleChange}>
                            <option value="Ticket de pago">Ticket de pago</option>
                            <option value="Boleta electronica">Boleta electrónica</option>
                            <option value="Recibo electronico">Recibo electrónico</option>
                            <option value="Formulario 1683">Formulario 1683</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>N° Factura/Doc</label>
                        <input name="doc_number" value={form.doc_number} onChange={handleChange} placeholder="F001-..." />
                    </div>
                </>
            )}

            {/* MONTO */}
            <div className={styles.inputGroup}>
                <label>Monto Total</label>
                <input 
                    type="number" name="amount" value={form.amount} onChange={handleChange} step="0.01" 
                    required={!form.is_multiple}
                    disabled={form.is_multiple}
                    placeholder={form.is_multiple ? "Auto (Suma de detalles)" : "0.00"}
                    style={form.is_multiple ? {backgroundColor: '#f3f4f6'} : {}}
                />
            </div>

            {/* IDENTIFICADORES BANCARIOS */}
            <div className={styles.inputGroup}>
                <label>N° Movimiento (Banco)</label>
                <input name="movement_number" value={form.movement_number} onChange={handleChange} placeholder="Para conciliación" />
            </div>
            <div className={styles.inputGroup}>
                <label>N° Voucher / Op. Global</label>
                <input name="operation_number" value={form.operation_number} onChange={handleChange} placeholder="Código de la App/Voucher" />
            </div>

            {/* EXTRAS */}
            {isExpenseOrPayment && (
                <>
                    <div className={styles.inputGroup}>
                        <label>Concepto</label>
                        <select name="concept" value={form.concept} onChange={handleChange}>
                            <option value="Otro">Otro</option>
                            <option value="Peaje">Peaje</option>
                            <option value="Sunat">Sunat</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Aplicar a</label>
                        <input name="apply_to" value={form.apply_to} onChange={handleChange} placeholder="Placa / Área" />
                    </div>
                    {!form.is_multiple && (
                        <div className={styles.inputGroup} style={{display:'flex', alignItems:'center', marginTop:'25px'}}>
                            <input type="checkbox" name="has_igv" checked={form.has_igv} onChange={handleChange} style={{width:'auto', marginRight:'5px'}} />
                            <label>Tiene IGV</label>
                        </div>
                    )}
                </>
            )}

            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Descripción / Detalle</label>
                <textarea name="detail" value={form.detail} onChange={handleChange} rows={2} />
            </div>

            {/* ARCHIVO (SOLO SI NO ES MÚLTIPLE) */}
            {!form.is_multiple && (
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Adjuntar Voucher / Factura</label>
                    <input type="file" onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)} />
                </div>
            )}

            <div className={styles.actions}>
                <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
                <button type="submit" className={styles.submitButton} disabled={isLoading || isUploading}>
                    {isUploading ? 'Subiendo...' : (form.is_multiple && !isEdit ? 'Siguiente: Agregar Items' : 'Guardar')}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};