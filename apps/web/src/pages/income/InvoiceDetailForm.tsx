import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import modalStyles from '../users/UserFormModal.module.css';
import type { InvoiceDetail } from './IngresoDetailPage'; // Importamos el tipo

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detailToEdit: InvoiceDetail | null; // Nuevo prop
}

const initialForm = {
  amount: '',
  reference_number: '',
};

export const InvoiceDetailFormModal = ({ isOpen, onClose, detailToEdit }: Props) => {
  const { id: incomeRecordId } = useParams<{ id: string }>();
  const [form, setForm] = useState(initialForm);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  
  const isEditMode = !!detailToEdit;

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
        if (detailToEdit) {
            setForm({
                amount: String(detailToEdit.amount),
                reference_number: detailToEdit.reference_number || '',
            });
        } else {
            setForm(initialForm);
        }
        setInvoiceFile(null);
        const inputFile = document.getElementById('modal-invoice-file-input') as HTMLInputElement;
        if (inputFile) inputFile.value = '';
    }
  }, [isOpen, detailToEdit]);

  // MUTACIÓN: CREAR
  const createMutation = useMutation({
    mutationFn: async () => {
      let invoiceUrl = null;

      // Subida opcional
      if (invoiceFile) {
        const fileName = `${Date.now()}-${invoiceFile.name}`;
        const { data, error: uploadError } = await getSupabase().storage.from('income-invoices').upload(`public/${fileName}`, invoiceFile);
        if (uploadError) throw uploadError;
        invoiceUrl = getSupabase().storage.from('income-invoices').getPublicUrl(data.path).data.publicUrl;
      }

      const params = {
        p_income_record_id: incomeRecordId,
        p_amount: parseFloat(form.amount),
        p_reference_number: form.reference_number || null,
        p_invoice_url: invoiceUrl, // Puede ser null
      };
      
      const { error: rpcError } = await getSupabase().rpc('add_invoice_detail', params);
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      toast.success('Factura añadida exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['incomeDetails', incomeRecordId] });
      onClose();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // MUTACIÓN: ACTUALIZAR
  const updateMutation = useMutation({
    mutationFn: async () => {
        let invoiceUrl = detailToEdit?.invoice_url || null; // Mantener URL anterior por defecto

        // Si sube archivo nuevo, lo procesamos
        if (invoiceFile) {
            const fileName = `${Date.now()}-${invoiceFile.name}`;
            const { data, error: uploadError } = await getSupabase().storage.from('income-invoices').upload(`public/${fileName}`, invoiceFile);
            if (uploadError) throw uploadError;
            invoiceUrl = getSupabase().storage.from('income-invoices').getPublicUrl(data.path).data.publicUrl;
        }

        const params = {
            p_detail_id: detailToEdit?.id,
            p_amount: parseFloat(form.amount),
            p_reference_number: form.reference_number || null,
            p_invoice_url: invoiceUrl,
        };

        const { error } = await getSupabase().rpc('update_invoice_detail', params);
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success('Factura actualizada exitosamente.');
        queryClient.invalidateQueries({ queryKey: ['incomeDetails', incomeRecordId] });
        onClose();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
        updateMutation.mutate();
    } else {
        createMutation.mutate();
    }
  };

  if (!isOpen) return null;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditMode ? 'Editar Factura' : 'Añadir Nueva Factura'}</h3>
        <form onSubmit={handleSubmit} className={modalStyles.form}>
          <div className={modalStyles.inputGroup}>
            <label>Monto de la Factura</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required disabled={isLoading}/>
          </div>
          <div className={modalStyles.inputGroup}>
            <label>N° de Factura (Opcional)</label>
            <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} disabled={isLoading}/>
          </div>
          <div className={modalStyles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Adjuntar Factura (Opcional)</label>
            <input 
                id="modal-invoice-file-input" 
                type="file" 
                accept=".pdf,image/*" 
                onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)} 
                disabled={isLoading}
                // YA NO ES REQUIRED
            />
            {isEditMode && detailToEdit?.invoice_url && !invoiceFile && (
                <small>Archivo actual: <a href={detailToEdit.invoice_url} target="_blank" rel="noreferrer">Ver Documento</a></small>
            )}
          </div>
          <div className={modalStyles.actions}>
            <button type="button" onClick={onClose} className={modalStyles.cancelButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={modalStyles.submitButton} disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Añadir Factura')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};