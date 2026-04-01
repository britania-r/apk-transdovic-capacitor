// File: apps/web/src/pages/purchases/InvoiceSection.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from './SectionShared.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

const formatDate = (date: string | null) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

export const InvoiceSection = ({ details }: Props) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    invoice_number: details.invoice_number || '',
    invoice_reception_date: details.invoice_reception_date || '',
    invoice_emission_date: details.invoice_emission_date || '',
    invoice_payment_condition: details.invoice_payment_condition || '',
  });

  useEffect(() => {
    setForm({
      invoice_number: details.invoice_number || '',
      invoice_reception_date: details.invoice_reception_date || '',
      invoice_emission_date: details.invoice_emission_date || '',
      invoice_payment_condition: details.invoice_payment_condition || '',
    });
    setInvoiceFile(null);
  }, [details]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const supabase = getSupabase();
      let fileUrl = details.invoice_file_url;

      if (invoiceFile) {
        const filePath = `public/${details.id}/invoice_${Date.now()}_${invoiceFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices').upload(filePath, invoiceFile);
        if (uploadError) throw uploadError;
        fileUrl = supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl;
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update({ ...data, invoice_file_url: fileUrl })
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Datos de factura actualizados');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
      setInvoiceFile(null);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleCancel = () => {
    setForm({
      invoice_number: details.invoice_number || '',
      invoice_reception_date: details.invoice_reception_date || '',
      invoice_emission_date: details.invoice_emission_date || '',
      invoice_payment_condition: details.invoice_payment_condition || '',
    });
    setInvoiceFile(null);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className={styles.section}>
      <form onSubmit={handleSubmit}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Datos de factura</h3>
          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn}>
              <i className="bx bx-pencil"></i> Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>N° de factura</label>
                <input
                  value={form.invoice_number}
                  onChange={e => setForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                  placeholder="F001-00001"
                  className={styles.fieldInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Fecha de recepción</label>
                <input
                  type="date"
                  value={form.invoice_reception_date}
                  onChange={e => setForm(prev => ({ ...prev, invoice_reception_date: e.target.value }))}
                  className={styles.fieldInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Fecha de emisión</label>
                <input
                  type="date"
                  value={form.invoice_emission_date}
                  onChange={e => setForm(prev => ({ ...prev, invoice_emission_date: e.target.value }))}
                  className={styles.fieldInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Condición de pago</label>
                <input
                  value={form.invoice_payment_condition}
                  onChange={e => setForm(prev => ({ ...prev, invoice_payment_condition: e.target.value }))}
                  placeholder="Ej: 30 días"
                  className={styles.fieldInput}
                />
              </div>
              <div className={styles.fieldFull}>
                <label className={styles.fieldLabel}>Adjuntar factura (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={handleCancel} className={styles.cancelBtn} disabled={updateMutation.isPending}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
                ) : (
                  <><i className="bx bx-save"></i> Guardar</>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>N° de factura</span>
              <span className={styles.dataValue}>{details.invoice_number || '—'}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Fecha de recepción</span>
              <span className={styles.dataValue}>{formatDate(details.invoice_reception_date)}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Fecha de emisión</span>
              <span className={styles.dataValue}>{formatDate(details.invoice_emission_date)}</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Condición de pago</span>
              <span className={styles.dataValue}>{details.invoice_payment_condition || '—'}</span>
            </div>
            <div className={styles.dataItemFull}>
              <span className={styles.dataLabel}>Factura adjunta</span>
              {details.invoice_file_url ? (
                <a href={details.invoice_file_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                  <i className="bx bx-file"></i> Ver factura adjunta
                </a>
              ) : (
                <span className={styles.dataValue}>No hay archivo adjunto</span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};