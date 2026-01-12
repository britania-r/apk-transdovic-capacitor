// File: apps/web/src/pages/purchases/InvoiceSection.tsx

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import styles from '../users/UserFormModal.module.css';
import pageStyles from './PurchasesDetailsPage.module.css';

interface Props {
  details: PurchaseOrderDetails;
}

export const InvoiceSection = ({ details }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: details.invoice_number || '',
    invoice_reception_date: details.invoice_reception_date || '',
    invoice_emission_date: details.invoice_emission_date || '',
    invoice_payment_condition: details.invoice_payment_condition || '',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData({
      invoice_number: details.invoice_number || '',
      invoice_reception_date: details.invoice_reception_date || '',
      invoice_emission_date: details.invoice_emission_date || '',
      invoice_payment_condition: details.invoice_payment_condition || '',
    });
    setInvoiceFile(null); // Reset file on details change
  }, [details]);

  const updateMutation = useMutation({
    mutationFn: async (dataToUpdate: typeof formData) => {
      const supabase = getSupabase();
      let fileUrl = details.invoice_file_url; // Mantener la URL existente por defecto

      // Si se adjunta un nuevo archivo, subirlo primero
      if (invoiceFile) {
        const filePath = `public/${details.id}/invoice_${Date.now()}_${invoiceFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('invoices').upload(filePath, invoiceFile);
        if (uploadError) throw uploadError;
        fileUrl = supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl;
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update({ ...dataToUpdate, invoice_file_url: fileUrl })
        .eq('id', details.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Datos de factura actualizados.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setIsEditing(false);
    },
    onError: (error: Error) => toast.error(`Error al actualizar: ${error.message}`),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  const handleCancel = () => {
    // Restaurar el estado original
    setIsEditing(false);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSave}>
        <div className={pageStyles.cardHeader} style={{padding: '0 0 1rem 0', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0}}>Datos de Factura</h2>
          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} className="button-secondary">Editar</button>
          )}
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}><label>N° de Factura</label>
            {isEditing ? <input name="invoice_number" value={formData.invoice_number} onChange={handleChange} /> : <p className={pageStyles.value}>{details.invoice_number || '-'}</p>}
          </div>
          <div className={styles.inputGroup}><label>Fecha de Recepción</label>
            {isEditing ? <input type="date" name="invoice_reception_date" value={formData.invoice_reception_date} onChange={handleChange} /> : <p className={pageStyles.value}>{details.invoice_reception_date ? new Date(details.invoice_reception_date).toLocaleDateString('es-PE') : '-'}</p>}
          </div>
          <div className={styles.inputGroup}><label>Fecha de Emisión</label>
            {isEditing ? <input type="date" name="invoice_emission_date" value={formData.invoice_emission_date} onChange={handleChange} /> : <p className={pageStyles.value}>{details.invoice_emission_date ? new Date(details.invoice_emission_date).toLocaleDateString('es-PE') : '-'}</p>}
          </div>
          <div className={styles.inputGroup}><label>Condición de Pago (Factura)</label>
            {isEditing ? <input name="invoice_payment_condition" value={formData.invoice_payment_condition} onChange={handleChange} /> : <p className={pageStyles.value}>{details.invoice_payment_condition || '-'}</p>}
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Adjuntar Factura (PDF)</label>
            {isEditing ? (
              <input type="file" accept=".pdf" onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)} />
            ) : (
              details.invoice_file_url ? <a href={details.invoice_file_url} target="_blank" rel="noopener noreferrer" className="link">Ver Factura Adjunta</a> : <p className={pageStyles.value}>No hay archivo adjunto</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton} disabled={updateMutation.isPending}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};