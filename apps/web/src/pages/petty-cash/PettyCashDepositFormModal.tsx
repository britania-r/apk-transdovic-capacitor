// File: apps/web/src/pages/petty-cash/PettyCashDepositFormModal.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import type { PettyCashTransaction } from './PettyCashPage';
import styles from '../../components/ui/FormModal.module.css';
import localStyles from '../operations/OperationFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  transactionToEdit: PettyCashTransaction | null;
}

const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const INITIAL = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  currency: 'PEN',
  description: '',
  document_number: '',
  detail: '',
};

export const PettyCashDepositFormModal = ({ isOpen, onClose, onSubmit, isLoading, transactionToEdit }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isEdit = !!transactionToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (transactionToEdit) {
      setForm({
        date: transactionToEdit.transaction_date,
        amount: String(transactionToEdit.amount),
        currency: transactionToEdit.currency,
        description: transactionToEdit.description || '',
        document_number: transactionToEdit.document_number || '',
        detail: transactionToEdit.detail || '',
      });
    } else {
      setForm({ ...INITIAL, date: new Date().toISOString().split('T')[0] });
    }
    setVoucherFile(null);
  }, [isOpen, transactionToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(e.target.name, e.target.value);

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
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-wallet'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar registro' : 'Registrar ingreso'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del movimiento' : 'Registra un ingreso a caja chica'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Fecha <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <SimpleSelect
                label="Moneda"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => set('currency', v)}
                disabled={isEdit}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  N° Documento <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="document_number"
                  value={form.document_number}
                  onChange={handleChange}
                  placeholder="Ej. Op-123456"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Monto <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                  placeholder="0.00"
                  className={`${styles.input} ${isEdit ? styles.inputDisabled : ''}`}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Descripción principal <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Ej. Reposición Semanal"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Detalle adicional <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                name="detail"
                value={form.detail}
                onChange={handleChange}
                rows={2}
                placeholder="Detalles extra..."
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Comprobante <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                type="file"
                onChange={e => setVoucherFile(e.target.files ? e.target.files[0] : null)}
                className={localStyles.fileInput}
              />
              {isEdit && transactionToEdit?.voucher_url && (
                <a
                  href={transactionToEdit.voucher_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.optional}
                  style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px', display: 'inline-block' }}
                >
                  Ver archivo actual
                </a>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={totalLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={totalLoading}
            >
              {isUploading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Subiendo...</>
              ) : isLoading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
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