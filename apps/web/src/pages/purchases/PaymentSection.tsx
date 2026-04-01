// File: apps/web/src/pages/purchases/PaymentSection.tsx
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from './SectionShared.module.css';
import localStyles from './PaymentSection.module.css';

// --- Tipos ---
interface LinkedPaymentData {
  id: string;
  source: 'BANCO' | 'CAJA';
  date: string;
  account_id: string;
  account_label: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  operation_number: string;
  movement_number: string;
  document_number: string;
  detail: string;
  voucher_url: string | null;
  is_multiple: boolean;
}

interface Props {
  details: PurchaseOrderDetails;
  accounts: CompanyAccount[];
}

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (amount: number, currency = 'PEN') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);

// --- Componente ---
export const PaymentSection = ({ details, accounts }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const orderCurrency = details.currency || 'PEN';
  const baseAmount = details.has_igv
    ? Number(details.subtotal) * 1.18
    : Number(details.subtotal);

  const isPaidWithBank = !!details.operation_id;
  const isPaidWithCaja = !!(details as any).petty_cash_transaction_id;
  const isPaid = isPaidWithBank || isPaidWithCaja;

  // Estado del formulario
  const [form, setForm] = useState({
    payment_date: getLocalDate(),
    payment_currency: orderCurrency,
    account_id: '',
    amount: baseAmount.toFixed(2),
    exchange_rate: '1.000',
    operation_number: '',
    movement_number: '',
    is_multiple: false,
    doc_number: details.invoice_number || '',
    doc_type: 'Ticket de pago',
    detail: `Pago OC: ${details.order_code}`,
  });

  // Cargar datos si ya está pagado
  const { data: linkedPayment, isLoading: isLoadingPayment } = useQuery<LinkedPaymentData | null>({
    queryKey: ['linked_payment', details.id],
    queryFn: async () => {
      const supabase = getSupabase();

      if (details.operation_id) {
        const { data, error } = await supabase
          .from('operations')
          .select('*')
          .eq('id', details.operation_id)
          .single();
        if (error) throw error;

        // Buscar label de la cuenta
        const acc = accounts.find(a => a.id === data.account_id);
        const accLabel = acc
          ? `${acc.bank_name || 'Caja'} — ${acc.account_number} (${acc.account_type})`
          : 'Cuenta desconocida';

        return {
          id: data.id,
          source: 'BANCO',
          date: data.operation_date,
          account_id: data.account_id,
          account_label: accLabel,
          amount: Number(data.amount),
          currency: data.currency,
          exchange_rate: Number(data.exchange_rate || 1),
          operation_number: data.operation_number || '',
          movement_number: data.movement_number || '',
          document_number: data.document_number || '',
          detail: data.detail || '',
          voucher_url: data.voucher_url || null,
          is_multiple: data.is_multiple || false,
        };
      }

      if ((details as any).petty_cash_transaction_id) {
        const { data, error } = await supabase
          .from('petty_cash_transactions')
          .select('*')
          .eq('id', (details as any).petty_cash_transaction_id)
          .single();
        if (error) throw error;

        const acc = accounts.find(a => a.id === (details as any).petty_cash_account_id);
        const accLabel = acc
          ? `${acc.bank_name || 'Caja'} — ${acc.account_number} (CAJA)`
          : 'Caja chica';

        return {
          id: data.id,
          source: 'CAJA',
          date: data.transaction_date,
          account_id: '',
          account_label: accLabel,
          amount: Number(data.amount),
          currency: data.currency,
          exchange_rate: 1,
          operation_number: '',
          movement_number: '',
          document_number: data.document_number || '',
          detail: data.description || '',
          voucher_url: data.voucher_url || null,
          is_multiple: false,
        };
      }

      return null;
    },
    enabled: isPaid,
  });

  // Sincronizar formulario con datos cargados
  useEffect(() => {
    if (linkedPayment) {
      setForm({
        payment_date: linkedPayment.date,
        payment_currency: linkedPayment.currency,
        account_id: linkedPayment.account_id,
        amount: linkedPayment.amount.toFixed(2),
        exchange_rate: String(linkedPayment.exchange_rate),
        operation_number: linkedPayment.operation_number,
        movement_number: linkedPayment.movement_number,
        is_multiple: linkedPayment.is_multiple,
        doc_number: linkedPayment.document_number,
        doc_type: 'Ticket de pago',
        detail: linkedPayment.detail,
      });
    } else if (!isPaid) {
      recalculateAmount(orderCurrency, '1.000');
    }
  }, [linkedPayment, details.has_igv, details.subtotal]);

  // Cálculo de monto con tipo de cambio
  const recalculateAmount = (payCurrency: string, rateStr: string) => {
    const rate = parseFloat(rateStr) || 1;
    let finalAmount = baseAmount;

    if (orderCurrency !== payCurrency) {
      if (orderCurrency === 'USD' && payCurrency === 'PEN') finalAmount = baseAmount * rate;
      else if (orderCurrency === 'PEN' && payCurrency === 'USD') finalAmount = baseAmount / rate;
    }

    setForm(prev => ({ ...prev, amount: finalAmount.toFixed(2) }));
  };

  // Filtrar cuentas por moneda (BANCO + CAJA)
  const filteredAccounts = useMemo(() =>
    accounts.filter(acc => acc.currency === form.payment_currency),
    [accounts, form.payment_currency]
  );

  const accountOptions = useMemo(() =>
    filteredAccounts.map(a => ({
      value: a.id,
      label: `${a.bank_name || 'Caja'} — ${a.account_number} (${a.account_type})`,
    })),
    [filteredAccounts]
  );

  // Detectar si la cuenta seleccionada es BANCO o CAJA
  const selectedAccount = accounts.find(a => a.id === form.account_id);
  const paymentSource = selectedAccount?.account_type === 'CAJA' ? 'CAJA' : 'BANCO';

  const needsExchangeRate = orderCurrency !== form.payment_currency;
  const canEdit = !isPaid || isEditing;

  // Handlers
  const handleCurrencyChange = (value: string) => {
    setForm(prev => ({ ...prev, payment_currency: value, account_id: '' }));
    recalculateAmount(value, form.exchange_rate);
  };

  const handleExchangeRateChange = (value: string) => {
    setForm(prev => ({ ...prev, exchange_rate: value }));
    recalculateAmount(form.payment_currency, value);
  };

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Mutation para guardar/crear pago
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.account_id) throw new Error('Selecciona una cuenta de origen');

      const supabase = getSupabase();
      let finalVoucherUrl = linkedPayment?.voucher_url || null;

      // Upload voucher si hay archivo nuevo
      if (voucherFile) {
        const fileName = `voucher-oc-${details.order_code}-${Date.now()}`;
        const { data, error } = await supabase.storage
          .from('operation-evidences')
          .upload(`public/${fileName}`, voucherFile);
        if (error) throw new Error('Error subiendo voucher: ' + error.message);
        finalVoucherUrl = supabase.storage
          .from('operation-evidences')
          .getPublicUrl(data.path).data.publicUrl;
      }

      if (isPaid && linkedPayment) {
        // ── EDITAR pago existente ──
        if (linkedPayment.source === 'BANCO') {
          const { error } = await supabase.from('operations').update({
            account_id: form.account_id,
            operation_date: form.payment_date,
            amount: form.is_multiple ? 0 : Number(form.amount),
            currency: form.payment_currency,
            exchange_rate: Number(form.exchange_rate),
            operation_number: form.operation_number || null,
            movement_number: form.movement_number || null,
            document_number: form.is_multiple ? null : form.doc_number,
            detail: form.detail,
            voucher_url: finalVoucherUrl,
            is_multiple: form.is_multiple,
          } as any).eq('id', linkedPayment.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('petty_cash_transactions').update({
            transaction_date: form.payment_date,
            amount: Number(form.amount),
            description: form.detail,
            document_number: form.doc_number || null,
            voucher_url: finalVoucherUrl,
          }).eq('id', linkedPayment.id);
          if (error) throw error;
        }
        return linkedPayment.id;
      } else {
        // ── CREAR pago nuevo ──
        const { data: newId, error } = await supabase.rpc('pay_purchase_order', {
          p_order_id: details.id,
          p_account_id: form.account_id,
          p_payment_source: paymentSource,
          p_payment_date: form.payment_date,
          p_amount: Number(form.amount),
          p_currency: form.payment_currency,
          p_exchange_rate: Number(form.exchange_rate),
          p_is_multiple: form.is_multiple,
          p_operation_number: form.operation_number || null,
          p_document_number: form.is_multiple ? null : form.doc_number,
          p_document_type: form.doc_type,
          p_detail: form.detail,
          p_voucher_url: finalVoucherUrl,
          p_movement_number: form.movement_number || null,
        } as any);

        if (error) throw error;
        return newId;
      }
    },
    onSuccess: (returnedId) => {
      toast.success(isPaid ? 'Pago actualizado' : 'Pago registrado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      queryClient.invalidateQueries({ queryKey: ['linked_payment', details.id] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashBalances'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransactions'] });
      setIsEditing(false);
      setVoucherFile(null);

      if (form.is_multiple && returnedId && paymentSource === 'BANCO') {
        navigate(`/operaciones/${returnedId}`);
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setVoucherFile(null);
  };

  // Loading
  if (isLoadingPayment) {
    return (
      <div className={styles.section}>
        <div className={localStyles.loadingState}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando información del pago...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className={styles.sectionHeader}>
          <div className={localStyles.titleRow}>
            <h3 className={styles.sectionTitle}>
              {isPaid ? 'Detalle del pago' : 'Registrar pago'}
            </h3>
            {isPaid && (
              <span className={localStyles.paidBadge}>
                <i className="bx bx-check-circle"></i> PAGADO
                {linkedPayment?.source === 'CAJA' && ' (Caja chica)'}
              </span>
            )}
          </div>
          <div className={localStyles.headerRight}>
            <span className={localStyles.debtLabel}>
              Deuda: <strong>{formatCurrency(baseAmount, orderCurrency)}</strong>
            </span>
            {isPaid && !isEditing && (
              <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn}>
                <i className="bx bx-pencil"></i> Editar
              </button>
            )}
            {isEditing && isPaid && (
              <button type="button" onClick={handleCancel} className={styles.editBtn}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {canEdit ? (
          <>
            {/* Moneda de pago */}
            <div className={localStyles.currencySelector}>
              <span className={localStyles.currencyLabel}>Moneda de pago</span>
              <div className={localStyles.currencyOptions}>
                {CURRENCY_OPTIONS.map(opt => (
                  <label key={opt.value} className={`${localStyles.currencyOption} ${form.payment_currency === opt.value ? localStyles.currencyActive : ''}`}>
                    <input
                      type="radio"
                      name="payment_currency"
                      value={opt.value}
                      checked={form.payment_currency === opt.value}
                      onChange={() => handleCurrencyChange(opt.value)}
                      disabled={isPaid && !isEditing}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGrid}>
              {/* Cuenta */}
              <div className={styles.fieldFull}>
                <SimpleSelect
                  label={`Cuenta de origen (${form.payment_currency})`}
                  options={accountOptions}
                  value={form.account_id}
                  onChange={v => set('account_id', v)}
                  placeholder="Seleccionar cuenta..."
                  required
                />
                {selectedAccount && (
                  <span className={localStyles.accountHint}>
                    Tipo: {selectedAccount.account_type === 'CAJA' ? 'Caja chica' : 'Cuenta bancaria'}
                  </span>
                )}
              </div>

              {/* Tipo de cambio */}
              {needsExchangeRate && (
                <div className={`${styles.field} ${localStyles.exchangeField}`}>
                  <label className={styles.fieldLabel}>Tipo de cambio</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.exchange_rate}
                    onChange={e => handleExchangeRateChange(e.target.value)}
                    required
                    className={`${styles.fieldInput} ${localStyles.exchangeInput}`}
                  />
                </div>
              )}

              {/* Fecha */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Fecha de pago</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={e => set('payment_date', e.target.value)}
                  required
                  className={styles.fieldInput}
                />
              </div>

              {/* Monto */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Monto ({form.payment_currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  required={!form.is_multiple}
                  readOnly={form.is_multiple}
                  className={`${styles.fieldInput} ${form.is_multiple ? localStyles.disabledInput : ''}`}
                />
              </div>

              {/* Checkbox múltiple (solo BANCO) */}
              {paymentSource === 'BANCO' && (
                <div className={`${styles.fieldFull} ${localStyles.multipleCheckbox}`}>
                  <div className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      id="is_multiple"
                      checked={form.is_multiple}
                      onChange={e => set('is_multiple', e.target.checked)}
                    />
                    <label htmlFor="is_multiple">Sustentar con múltiples facturas</label>
                  </div>
                </div>
              )}

              {/* Doc number (si no es múltiple) */}
              {!form.is_multiple && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>N° factura</label>
                  <input
                    value={form.doc_number}
                    onChange={e => set('doc_number', e.target.value)}
                    placeholder="F001-00001"
                    className={styles.fieldInput}
                  />
                </div>
              )}

              {/* N° movimiento (solo BANCO) */}
              {paymentSource === 'BANCO' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>N° movimiento (banco)</label>
                  <input
                    value={form.movement_number}
                    onChange={e => set('movement_number', e.target.value)}
                    placeholder="Conciliación"
                    className={styles.fieldInput}
                  />
                </div>
              )}

              {/* N° voucher (solo BANCO) */}
              {paymentSource === 'BANCO' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>N° voucher</label>
                  <input
                    value={form.operation_number}
                    onChange={e => set('operation_number', e.target.value)}
                    className={styles.fieldInput}
                  />
                </div>
              )}

              {/* Comprobante */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Comprobante</label>
                <input
                  type="file"
                  onChange={e => setVoucherFile(e.target.files?.[0] || null)}
                  accept="image/*,.pdf"
                  className={styles.fileInput}
                />
                {linkedPayment?.voucher_url && !voucherFile && (
                  <a href={linkedPayment.voucher_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                    <i className="bx bx-file"></i> Ver adjunto actual
                  </a>
                )}
              </div>

              {/* Detalle */}
              <div className={styles.fieldFull}>
                <label className={styles.fieldLabel}>Detalle / nota</label>
                <textarea
                  value={form.detail}
                  onChange={e => set('detail', e.target.value)}
                  rows={2}
                  className={styles.textarea}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              {isEditing && (
                <button type="button" onClick={handleCancel} className={styles.cancelBtn} disabled={saveMutation.isPending}>
                  Cancelar
                </button>
              )}
              <button type="submit" className={styles.saveBtn} disabled={saveMutation.isPending || !form.account_id}>
                {saveMutation.isPending ? (
                  <><i className="bx bx-loader-alt bx-spin"></i> Procesando...</>
                ) : form.is_multiple && !isPaid ? (
                  <><i className="bx bx-right-arrow-alt"></i> Registrar y cargar facturas</>
                ) : isPaid ? (
                  <><i className="bx bx-save"></i> Guardar cambios</>
                ) : (
                  <><i className="bx bx-check"></i> Confirmar pago</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* ── Vista de solo lectura ── */
          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Fecha de pago</span>
              <span className={styles.dataValue}>{formatDate(linkedPayment?.date || '')}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Cuenta</span>
              <span className={styles.dataValue}>{linkedPayment?.account_label || '—'}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Moneda</span>
              <span className={styles.dataValue}>{linkedPayment?.currency || '—'}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Monto</span>
              <span className={`${styles.dataValue} ${localStyles.amountValue}`}>
                {linkedPayment ? formatCurrency(linkedPayment.amount, linkedPayment.currency) : '—'}
              </span>
            </div>
            {linkedPayment?.exchange_rate && linkedPayment.exchange_rate !== 1 && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Tipo de cambio</span>
                <span className={styles.dataValue}>{linkedPayment.exchange_rate}</span>
              </div>
            )}
            {linkedPayment?.document_number && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>N° factura</span>
                <span className={styles.dataValue}>{linkedPayment.document_number}</span>
              </div>
            )}
            {linkedPayment?.movement_number && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>N° movimiento</span>
                <span className={styles.dataValue}>{linkedPayment.movement_number}</span>
              </div>
            )}
            {linkedPayment?.operation_number && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>N° voucher</span>
                <span className={styles.dataValue}>{linkedPayment.operation_number}</span>
              </div>
            )}
            {linkedPayment?.detail && (
              <div className={styles.dataItemFull}>
                <span className={styles.dataLabel}>Detalle</span>
                <span className={styles.dataValue}>{linkedPayment.detail}</span>
              </div>
            )}
            {linkedPayment?.voucher_url && (
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Comprobante</span>
                <a href={linkedPayment.voucher_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                  <i className="bx bx-file"></i> Ver adjunto
                </a>
              </div>
            )}
            {linkedPayment?.is_multiple && linkedPayment.source === 'BANCO' && details.operation_id && (
              <div className={styles.dataItemFull}>
                <a href={`/operaciones/${details.operation_id}`} className={styles.fileLink}>
                  <i className="bx bx-spreadsheet"></i> Ver facturas múltiples
                </a>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};