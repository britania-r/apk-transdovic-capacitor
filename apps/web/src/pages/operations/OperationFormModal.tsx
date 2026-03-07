// File: apps/web/src/pages/operations/OperationFormModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import type { Operation, OperationType, DepositSubtype, DocType, ConceptType } from './hooks/useOperations';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './OperationFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  isLoading: boolean;
  opToEdit: Operation | null;
  accounts: CompanyAccount[];
}

const INITIAL = {
  operation_date: new Date().toISOString().split('T')[0],
  operation_type: 'GASTO' as OperationType,
  account_id: '',
  amount: '',
  currency: 'PEN',
  detail: '',
  movement_number: '',
  operation_number: '',
  deposit_subtype: 'TRANSFERENCIA' as DepositSubtype | 'OTROS',
  custom_deposit_subtype: '',
  destination_account_id: '',
  doc_type: 'Ticket de pago' as DocType | 'OTROS',
  custom_doc_type: '',
  doc_number: '',
  has_igv: false,
  concept: 'Otro' as ConceptType | 'OTROS',
  custom_concept: '',
  apply_to: '',
  is_multiple: false,
};

const TYPE_OPTIONS = [
  { value: 'GASTO', label: 'Gasto' },
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'RETIRO', label: 'Retiro' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const DEPOSIT_SUBTYPE_OPTIONS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANCARIZACION', label: 'Bancarización' },
  { value: 'VENTANILLA', label: 'Ventanilla' },
  { value: 'OTROS', label: 'Otros' },
];

const DOC_TYPE_OPTIONS = [
  { value: 'Ticket de pago', label: 'Ticket de pago' },
  { value: 'Boleta electronica', label: 'Boleta electrónica' },
  { value: 'Recibo electronico', label: 'Recibo electrónico' },
  { value: 'Formulario 1683', label: 'Formulario 1683' },
  { value: 'OTROS', label: 'Otros' },
];

const CONCEPT_OPTIONS = [
  { value: 'Peaje', label: 'Peaje' },
  { value: 'Sunat', label: 'Sunat' },
  { value: 'OTROS', label: 'Otros' },
];

export const OperationFormModal = ({ isOpen, onClose, onSuccess, isLoading, opToEdit, accounts }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isEdit = !!opToEdit;

  const filteredAccounts = useMemo(() =>
    accounts.filter(acc => acc.account_type === 'BANCO' && acc.currency === form.currency),
    [accounts, form.currency]
  );

  const accountOptions = filteredAccounts.map(a => ({
    value: a.id,
    label: `${a.bank_name} ${a.currency} — ${a.account_number}`,
  }));

  useEffect(() => {
    if (!isOpen) return;
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
        custom_deposit_subtype: (opToEdit as any).custom_deposit_subtype || '',
        destination_account_id: opToEdit.destination_account_id || '',
        doc_type: opToEdit.document_type || 'Ticket de pago',
        custom_doc_type: (opToEdit as any).custom_document_type || '',
        doc_number: opToEdit.document_number || '',
        has_igv: opToEdit.has_igv || false,
        concept: opToEdit.concept || 'Otro',
        custom_concept: (opToEdit as any).custom_concept || '',
        apply_to: opToEdit.apply_to || '',
        is_multiple: opToEdit.is_multiple,
      });
    } else {
      setForm({ ...INITIAL, operation_date: new Date().toISOString().split('T')[0] });
    }
    setVoucherFile(null);
  }, [isOpen, opToEdit]);

  const isDeposit = form.operation_type === 'DEPOSITO';
  const isTransfer = form.operation_type === 'TRANSFERENCIA';
  const isExpenseOrPayment = ['GASTO', 'PAGO'].includes(form.operation_type);

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    set(name, val);
  };

  const handleCurrencyChange = (value: string) => {
    if (value !== form.currency) {
      setForm(prev => ({ ...prev, currency: value, account_id: '', destination_account_id: '' }));
    }
  };

  const cleanData = (rawData: any) => {
    const cleaned: any = {};
    for (const key in rawData) {
      const v = rawData[key];
      cleaned[key] = typeof v === 'string' && v.trim() === '' ? null : v;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_id) {
      toast.error('Selecciona una cuenta bancaria');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = getSupabase();
      let voucherUrl = opToEdit?.voucher_url || null;

      if (voucherFile && !form.is_multiple) {
        const fileName = `op-${Date.now()}-${voucherFile.name}`;
        const { data, error } = await supabase.storage.from('operation-evidences').upload(`public/${fileName}`, voucherFile);
        if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
        const { data: urlData } = supabase.storage.from('operation-evidences').getPublicUrl(data.path);
        voucherUrl = urlData.publicUrl;
      }

      const payload = {
        p_id: opToEdit?.id || null,
        p_date: form.operation_date,
        p_type: form.operation_type,
        p_account_id: form.account_id,
        p_amount: (form.is_multiple && !isEdit) ? 0 : parseFloat(form.amount || '0'),
        p_currency: form.currency,
        p_is_multiple: form.is_multiple,
        p_detail: form.detail,
        p_movement_number: form.movement_number,
        p_operation_number: form.operation_number,
        p_voucher_url: voucherUrl,
        p_deposit_subtype: isDeposit ? form.deposit_subtype : null,
        p_custom_deposit_subtype: (isDeposit && form.deposit_subtype === 'OTROS') ? form.custom_deposit_subtype : null,
        p_destination_account_id: isTransfer ? form.destination_account_id : null,
        p_document_type: isExpenseOrPayment ? form.doc_type : null,
        p_custom_document_type: (isExpenseOrPayment && form.doc_type === 'OTROS') ? form.custom_doc_type : null,
        p_document_number: (!form.is_multiple && (isExpenseOrPayment || isDeposit)) ? form.doc_number : null,
        p_has_igv: isExpenseOrPayment ? form.has_igv : false,
        p_apply_to: isExpenseOrPayment ? form.apply_to : null,
        p_concept: isExpenseOrPayment ? form.concept : null,
        p_custom_concept: (isExpenseOrPayment && form.concept === 'OTROS') ? form.custom_concept : null,
        p_entity_name: null,
        p_details_json: null,
      };

      onSuccess(cleanData(payload));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={`${formStyles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-receipt'}></i>
            </div>
            <div>
              <h3 className={formStyles.modalTitle}>
                {isEdit ? 'Editar operación' : 'Nueva operación'}
              </h3>
              <p className={formStyles.modalSubtitle}>
                {isEdit ? 'Modifica los datos de la operación' : 'Completa los datos para registrar una operación'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>

            {/* Tipo + Fecha */}
            <div className={formStyles.row}>
              <SimpleSelect
                label="Tipo"
                options={TYPE_OPTIONS}
                value={form.operation_type}
                onChange={v => set('operation_type', v)}
                disabled={isEdit}
                required
              />
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Fecha <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="operation_date"
                  value={form.operation_date}
                  onChange={handleChange}
                  required
                  className={formStyles.input}
                />
              </div>
            </div>

            {/* Checkbox múltiple */}
            {!isTransfer && (
              <div className={styles.checkboxCard}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_multiple"
                    checked={form.is_multiple}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    <strong>Tiene múltiples facturas / items</strong>
                    {form.is_multiple && (
                      <small>Se creará la operación y serás redirigido para cargar los detalles</small>
                    )}
                  </span>
                </label>
              </div>
            )}

            {/* Moneda + Cuenta */}
            <div className={formStyles.row}>
              <SimpleSelect
                label="Moneda"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={handleCurrencyChange}
                disabled={isEdit}
                required
              />
              <SimpleSelect
                label={isDeposit ? 'Cuenta destino' : 'Cuenta origen'}
                options={accountOptions}
                value={form.account_id}
                onChange={v => set('account_id', v)}
                placeholder="Seleccionar banco..."
                required
              />
            </div>

            {/* Transferencia → cuenta destino */}
            {isTransfer && (
              <SimpleSelect
                label="Cuenta destino"
                options={accountOptions}
                value={form.destination_account_id}
                onChange={v => set('destination_account_id', v)}
                placeholder="Seleccionar banco..."
                required
              />
            )}

            {/* Depósito → subtipo */}
            {isDeposit && (
              <div className={formStyles.row}>
                <SimpleSelect
                  label="Subtipo"
                  options={DEPOSIT_SUBTYPE_OPTIONS}
                  value={form.deposit_subtype}
                  onChange={v => set('deposit_subtype', v)}
                />
                {form.deposit_subtype === 'OTROS' && (
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Detalle subtipo <span className={formStyles.required}>*</span>
                    </label>
                    <input
                      name="custom_deposit_subtype"
                      value={form.custom_deposit_subtype}
                      onChange={handleChange}
                      placeholder="Especifique..."
                      required
                      className={formStyles.input}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Gasto/Pago → doc type + doc number */}
            {!form.is_multiple && isExpenseOrPayment && (
              <div className={formStyles.row}>
                <SimpleSelect
                  label="Tipo documento"
                  options={DOC_TYPE_OPTIONS}
                  value={form.doc_type}
                  onChange={v => set('doc_type', v)}
                />
                {form.doc_type === 'OTROS' ? (
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      Especifique doc. <span className={formStyles.required}>*</span>
                    </label>
                    <input
                      name="custom_doc_type"
                      value={form.custom_doc_type}
                      onChange={handleChange}
                      placeholder="Ej: Proforma"
                      required
                      className={formStyles.input}
                    />
                  </div>
                ) : (
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>
                      N° Factura/Doc <span className={formStyles.optional}>(opcional)</span>
                    </label>
                    <input
                      name="doc_number"
                      value={form.doc_number}
                      onChange={handleChange}
                      placeholder="F001-..."
                      className={formStyles.input}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Monto + N° Movimiento */}
            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Monto total {!form.is_multiple && <span className={formStyles.required}>*</span>}
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  step="0.01"
                  required={!form.is_multiple}
                  disabled={form.is_multiple}
                  placeholder={form.is_multiple ? 'Auto' : '0.00'}
                  className={`${formStyles.input} ${form.is_multiple ? formStyles.inputDisabled : ''}`}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  N° Movimiento <span className={formStyles.optional}>(banco)</span>
                </label>
                <input
                  name="movement_number"
                  value={form.movement_number}
                  onChange={handleChange}
                  placeholder="Para conciliación"
                  className={formStyles.input}
                />
              </div>
            </div>

            {/* N° Comprobante */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                N° de comprobante <span className={formStyles.optional}>(opcional)</span>
              </label>
              <input
                name="operation_number"
                value={form.operation_number}
                onChange={handleChange}
                placeholder="Código de la App/Voucher"
                className={formStyles.input}
              />
            </div>

            {/* Gasto/Pago → concepto + aplicar a + IGV */}
            {isExpenseOrPayment && (
              <>
                <div className={formStyles.row}>
                  <SimpleSelect
                    label="Concepto"
                    options={CONCEPT_OPTIONS}
                    value={form.concept}
                    onChange={v => set('concept', v)}
                  />
                  {form.concept === 'OTROS' ? (
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Especifique concepto <span className={formStyles.required}>*</span>
                      </label>
                      <input
                        name="custom_concept"
                        value={form.custom_concept}
                        onChange={handleChange}
                        placeholder="Ej: Propina"
                        required
                        className={formStyles.input}
                      />
                    </div>
                  ) : (
                    <div className={formStyles.field}>
                      <label className={formStyles.label}>
                        Aplicar a <span className={formStyles.optional}>(opcional)</span>
                      </label>
                      <input
                        name="apply_to"
                        value={form.apply_to}
                        onChange={handleChange}
                        placeholder="Placa / Área"
                        className={formStyles.input}
                      />
                    </div>
                  )}
                </div>

                {!form.is_multiple && (
                  <div className={styles.checkboxCard}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="has_igv"
                        checked={form.has_igv}
                        onChange={handleChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        <strong>Tiene IGV</strong>
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Detalle */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                Descripción / Detalle <span className={formStyles.optional}>(opcional)</span>
              </label>
              <textarea
                name="detail"
                value={form.detail}
                onChange={handleChange}
                rows={2}
                placeholder="Detalles adicionales..."
                className={formStyles.input}
              />
            </div>

            {/* Voucher */}
            {!form.is_multiple && (
              <div className={formStyles.field}>
                <label className={formStyles.label}>
                  Adjuntar voucher <span className={formStyles.optional}>(opcional)</span>
                </label>
                <input
                  type="file"
                  onChange={e => setVoucherFile(e.target.files ? e.target.files[0] : null)}
                  className={styles.fileInput}
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
              disabled={isLoading || isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={formStyles.submitBtn}
              disabled={isLoading || isUploading}
            >
              {isUploading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Subiendo...</>
              ) : form.is_multiple && !isEdit ? (
                <><i className="bx bx-right-arrow-alt"></i> Siguiente: Agregar Items</>
              ) : (
                <><i className="bx bx-save"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};