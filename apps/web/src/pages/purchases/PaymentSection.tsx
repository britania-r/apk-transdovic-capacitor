import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UserFormModal.module.css';
import pageStyles from './PurchasesDetailsPage.module.css';

// --- INTERFAZ PARA TIPADO DE OPERACIÓN ---
interface OperationData {
  id: string;
  operation_date: string;
  account_id: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  operation_number?: string;
  movement_number?: string;
  document_number?: string;
  document_type?: string;
  detail?: string;
  voucher_url?: string;
  is_multiple?: boolean;
  // Campos visuales (join)
  account_name?: string; 
}

interface Props {
  details: PurchaseOrderDetails;
  accounts: CompanyAccount[];
}

// Helper para fecha local YYYY-MM-DD
const getLocalISOString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const PaymentSection = ({ details, accounts }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  // MONEDA BASE DE LA ORDEN
  const orderCurrency = details.currency || 'PEN';
  // Monto Base (con o sin IGV)
  const baseAmount = details.has_igv 
    ? Number(details.subtotal) * 1.18 
    : Number(details.subtotal);

  // Estado del Formulario
  const [form, setForm] = useState({
    payment_date: getLocalISOString(),
    payment_currency: orderCurrency, // Moneda con la que voy a pagar (Default: la de la orden)
    account_id: '',
    amount: baseAmount.toFixed(2), // Monto final a salir de la cuenta
    exchange_rate: '1.000',
    
    operation_number: '',
    movement_number: '', 
    
    is_multiple: false,
    doc_number: details.invoice_number || '',
    doc_type: 'Ticket de pago',
    
    detail: `Pago OC: ${details.order_code}`,
    voucher_url: null as string | null
  });

  // CARGAR DATOS SI YA ESTÁ PAGADO
  const { data: operationData, isLoading: isLoadingOp } = useQuery<OperationData>({
    queryKey: ['operation_linked', details.operation_id],
    queryFn: async () => {
      if (!details.operation_id) return null;
      const { data, error } = await getSupabase()
        .from('operations')
        .select(`
            *,
            account:account_id ( bank_name, account_number )
        `)
        .eq('id', details.operation_id)
        .single();
      
      if (error) throw error;
      
      // Mapeo para facilitar acceso a nombre de cuenta
      return {
          ...data,
          account_name: data.account ? `${data.account.bank_name} - ${data.account.account_number}` : 'Cuenta desconocida'
      } as OperationData;
    },
    enabled: !!details.operation_id
  });

  // SINCRONIZAR FORMULARIO
  useEffect(() => {
    if (operationData) {
      setForm(prev => ({
        ...prev,
        payment_date: operationData.operation_date,
        account_id: operationData.account_id,
        amount: Number(operationData.amount).toFixed(2),
        payment_currency: operationData.currency,
        exchange_rate: String(operationData.exchange_rate || '1.000'),
        operation_number: operationData.operation_number || '',
        movement_number: operationData.movement_number || '',
        doc_number: operationData.document_number || '',
        doc_type: operationData.document_type || 'Ticket de pago',
        detail: operationData.detail || '',
        voucher_url: operationData.voucher_url || null,
        is_multiple: operationData.is_multiple || false
      }));
    } else if (!details.operation_id) {
       // Si no pagado, y cambia el IGV o la moneda de pago, recalcular
       calculateAmount(form.payment_currency, form.exchange_rate);
    }
  }, [operationData, details.has_igv, details.subtotal, details.operation_id]);

  // Lógica de Cálculo de Monto
  const calculateAmount = (payCurrency: string, rateStr: string) => {
      const rate = parseFloat(rateStr) || 1;
      let finalAmount = baseAmount;

      if (orderCurrency !== payCurrency) {
          // Conversión
          if (orderCurrency === 'USD' && payCurrency === 'PEN') {
              finalAmount = baseAmount * rate;
          } else if (orderCurrency === 'PEN' && payCurrency === 'USD') {
              finalAmount = baseAmount / rate;
          }
      }
      
      setForm(prev => ({ ...prev, amount: finalAmount.toFixed(2) }));
  };

  // Filtrar Cuentas según la moneda de pago seleccionada
  // (Mostramos Bancos y Cajas que coincidan con la moneda)
  const filteredAccounts = accounts.filter(acc => acc.currency === form.payment_currency);

  const needsExchangeRate = orderCurrency !== form.payment_currency;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.account_id) throw new Error("Selecciona una cuenta de origen");
      
      const supabase = getSupabase();
      let finalVoucherUrl = form.voucher_url;

      if (voucherFile) {
        const fileName = `voucher-oc-${details.order_code}-${Date.now()}`;
        const { data, error } = await supabase.storage.from('operation-evidences').upload(`public/${fileName}`, voucherFile);
        if (error) throw new Error("Error subiendo voucher: " + error.message);
        finalVoucherUrl = supabase.storage.from('operation-evidences').getPublicUrl(data.path).data.publicUrl;
      }

      const amountToSend = form.is_multiple ? 0 : Number(form.amount);

      if (details.operation_id) {
        // UPDATE (Manual)
        const { error } = await supabase.from('operations').update({
            account_id: form.account_id,
            operation_date: form.payment_date,
            amount: amountToSend,
            currency: form.payment_currency,
            exchange_rate: Number(form.exchange_rate),
            operation_number: form.operation_number || null,
            movement_number: form.movement_number || null,
            document_number: form.is_multiple ? null : form.doc_number,
            detail: form.detail,
            voucher_url: finalVoucherUrl,
            is_multiple: form.is_multiple
        } as any).eq('id', details.operation_id);
        
        if (error) throw error;
        return details.operation_id;
      } else {
        // CREATE (RPC)
        const { data: opId, error } = await supabase.rpc('pay_purchase_order', {
            p_order_id: details.id,
            p_account_id: form.account_id,
            p_payment_date: form.payment_date,
            p_amount: amountToSend,
            p_currency: form.payment_currency,
            p_exchange_rate: Number(form.exchange_rate),
            p_operation_number: form.operation_number || null,
            p_document_number: form.is_multiple ? null : form.doc_number,
            p_document_type: form.doc_type,
            p_detail: form.detail,
            p_voucher_url: finalVoucherUrl,
            p_is_multiple: form.is_multiple
        } as any); // Casteo 'as any' para evitar conflictos de tipado RPC
        
        if (error) throw error;
        
        // Parche update movement_number
        if (form.movement_number && opId) {
            await supabase.from('operations').update({ movement_number: form.movement_number } as any).eq('id', opId);
        }
        return opId;
      }
    },
    onSuccess: (opId) => {
      toast.success(details.operation_id ? 'Pago actualizado' : 'Pago registrado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      queryClient.invalidateQueries({ queryKey: ['operation_linked', details.operation_id] });
      setIsEditing(false);
      setVoucherFile(null);

      if (form.is_multiple && opId) {
          navigate(`/operaciones/${opId}`);
      }
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'payment_currency') {
        setForm(prev => ({ ...prev, payment_currency: value, account_id: '' }));
        calculateAmount(value, form.exchange_rate);
    } else if (name === 'exchange_rate') {
        setForm(prev => ({ ...prev, exchange_rate: value }));
        calculateAmount(form.payment_currency, value);
    } else {
        setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const canEdit = !details.operation_id || isEditing;
  const isPaid = !!details.operation_id;

  if (isLoadingOp) return <p style={{padding:'20px'}}>Cargando información del pago...</p>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div className={pageStyles.cardHeader} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
            <h2 style={{ margin: 0 }}>
                {isPaid ? 'Detalle del Pago' : 'Registrar Pago'}
                {isPaid && <span style={{fontSize:'0.6em', background:'#dcfce7', color:'#166534', padding:'4px 8px', borderRadius:'12px', marginLeft:'10px', verticalAlign:'middle'}}>PAGADO</span>}
            </h2>
            <p style={{ margin: '5px 0 0', color: '#666' }}>
                Deuda Total: <strong>{orderCurrency} {baseAmount.toFixed(2)}</strong>
            </p>
        </div>
        {isPaid && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="button-secondary"><i className='bx bx-pencil'></i> Editar</button>
        )}
        {isEditing && isPaid && (
            <button onClick={() => { setIsEditing(false); setVoucherFile(null); }} style={{background:'none', border:'none', color:'#666', cursor:'pointer', textDecoration:'underline'}}>Cancelar</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* SELECCION MONEDA DE PAGO */}
        <div className={styles.inputGroup} style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', gridColumn:'1/-1'}}>
            <label style={{marginBottom:'10px', display:'block', color:'#334155', fontWeight:600}}>Moneda de Pago</label>
            <div style={{display:'flex', gap:'20px'}}>
                <label style={{cursor:'pointer', display:'flex', alignItems:'center'}}>
                    <input type="radio" name="payment_currency" value="PEN" checked={form.payment_currency === 'PEN'} onChange={handleChange} disabled={!canEdit} style={{marginRight:'5px'}} />
                    Soles (PEN)
                </label>
                <label style={{cursor:'pointer', display:'flex', alignItems:'center'}}>
                    <input type="radio" name="payment_currency" value="USD" checked={form.payment_currency === 'USD'} onChange={handleChange} disabled={!canEdit} style={{marginRight:'5px'}} />
                    Dólares (USD)
                </label>
            </div>
        </div>

        {/* CUENTA */}
        <div className={styles.inputGroup}>
            <label>Cuenta de Origen ({form.payment_currency})</label>
            <select name="account_id" value={form.account_id} onChange={handleChange} required disabled={!canEdit} style={{ height:'42px', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }}>
                <option value="">-- Seleccionar --</option>
                {/* Mostrar cuenta actual aunque no esté en filtro (si estamos viendo detalle) */}
                {(!canEdit && form.account_id) && !filteredAccounts.find(a => a.id === form.account_id) && (
                    <option value={form.account_id}>{operationData?.account_name || 'Cuenta archivada'}</option>
                )}
                {filteredAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                        {acc.bank_name} - {acc.account_number} ({acc.account_type})
                    </option>
                ))}
            </select>
        </div>

        {/* TIPO DE CAMBIO */}
        {needsExchangeRate && (
            <div className={styles.inputGroup} style={{background:'#fff7ed', padding:'10px', borderRadius:'6px', border:'1px solid #fed7aa'}}>
                <label style={{color:'#c2410c'}}>Tipo de Cambio</label>
                <input 
                    type="number" step="0.001" name="exchange_rate"
                    value={form.exchange_rate} onChange={handleChange} 
                    required readOnly={!canEdit}
                    style={{ height:'42px', fontWeight:'bold', color:'#c2410c' }}
                />
            </div>
        )}

        <div className={styles.inputGroup}>
            <label>Fecha de Pago</label>
            <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} required readOnly={!canEdit} style={{ height:'42px', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }} />
        </div>

        <div className={styles.inputGroup}>
            <label>Monto a Pagar ({form.payment_currency})</label>
            <input 
                type="number" step="0.01" name="amount"
                value={form.amount} onChange={handleChange} 
                required readOnly={!canEdit || form.is_multiple}
                style={{ height:'42px', fontWeight:'bold', backgroundColor: (!canEdit || form.is_multiple) ? '#f3f4f6' : '#fff' }}
            />
        </div>

        {/* CHECKBOX MÚLTIPLE */}
        {canEdit && (
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', background: '#f0f9ff', padding: '10px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" name="is_multiple" checked={form.is_multiple} onChange={(e) => setForm(prev => ({ ...prev, is_multiple: e.target.checked }))} style={{ width: 'auto', marginRight: '10px', cursor:'pointer' }} />
                    <label style={{ fontWeight: 'bold', color: '#0369a1', cursor:'pointer' }}>Sustentar con Múltiples Facturas</label>
                </div>
            </div>
        )}

        {!form.is_multiple && (
            <div className={styles.inputGroup}>
                <label>N° Factura Única</label>
                <input name="doc_number" value={form.doc_number} onChange={handleChange} readOnly={!canEdit} style={{ height:'42px', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }} />
            </div>
        )}

        <div className={styles.inputGroup}>
            <label>N° Movimiento (Banco)</label>
            <input name="movement_number" value={form.movement_number} onChange={handleChange} placeholder="Conciliación" readOnly={!canEdit} style={{ height:'42px', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }} />
        </div>

        <div className={styles.inputGroup}>
            <label>N° Voucher</label>
            <input name="operation_number" value={form.operation_number} onChange={handleChange} readOnly={!canEdit} style={{ height:'42px', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }} />
        </div>

        <div className={styles.inputGroup}>
            <label>Comprobante</label>
            {canEdit ? (
                <input type="file" onChange={e => setVoucherFile(e.target.files?.[0] || null)} accept="image/*,.pdf" style={{ paddingTop:'8px' }} />
            ) : (
                <div style={{padding:'10px', background:'#f9fafb', borderRadius:'6px', border:'1px solid #e5e7eb'}}>
                    {form.voucher_url ? (
                        <a href={form.voucher_url} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>Ver Adjunto</a>
                    ) : <span style={{color:'#999'}}>Sin archivo</span>}
                </div>
            )}
        </div>

        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Detalle / Nota</label>
            <textarea name="detail" value={form.detail} onChange={handleChange} rows={2} readOnly={!canEdit} style={{ resize:'vertical', backgroundColor: !canEdit ? '#f9fafb' : '#fff' }} />
        </div>

        {canEdit && (
            <div className={styles.actions} style={{ gridColumn: '1 / -1', marginTop: '1rem', display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" className={styles.submitButton} disabled={saveMutation.isPending || !form.account_id} style={{ minWidth: '200px', height:'45px', fontSize:'1rem' }}>
                    {saveMutation.isPending ? 'Procesando...' : (form.is_multiple ? 'Registrar y Cargar Facturas' : (isPaid ? 'Guardar Cambios' : 'Confirmar Pago'))}
                </button>
            </div>
        )}
      </form>
    </div>
  );
};