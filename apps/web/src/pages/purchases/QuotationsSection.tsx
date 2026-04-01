// File: apps/web/src/pages/purchases/QuotationsSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { QuotationsTable } from './QuotationsTable';
import { QuotationFormModal } from './QuotationFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { PurchaseOrderDetails, Quotation } from './PurchasesDetailsPage';
import type { SupplierInList } from '../suppilers/SuppliersPage';
import styles from './SectionShared.module.css';

interface Props {
  details: PurchaseOrderDetails;
  suppliers: SupplierInList[];
}

export const QuotationsSection = ({ details, suppliers }: Props) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isApproveOpen, setApproveOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
  };

  const closeAll = () => {
    setModalOpen(false);
    setApproveOpen(false);
    setDeleteOpen(false);
    setSelected(null);
  };

  const addMutation = useMutation({
    mutationFn: async ({ supplier_id, file }: { supplier_id: string; file: File }) => {
      const supabase = getSupabase();
      const filePath = `public/${details.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quotations').upload(filePath, file);
      if (uploadError) throw uploadError;
      const fileUrl = supabase.storage.from('quotations').getPublicUrl(uploadData.path).data.publicUrl;
      const { error: insertError } = await supabase.from('purchase_quotations').insert({
        purchase_order_id: details.id,
        supplier_id,
        file_url: fileUrl,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => { toast.success('Cotización agregada'); invalidate(); closeAll(); },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const approveMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const { error } = await getSupabase().rpc('approve_quotation', {
        p_quotation_id: quotationId,
        p_order_id: details.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Cotización aprobada. Proveedor asignado a la orden.'); invalidate(); closeAll(); },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (quotation: Quotation) => {
      const supabase = getSupabase();
      if (quotation.file_url) {
        const path = quotation.file_url.split('/quotations/')[1];
        if (path) await supabase.storage.from('quotations').remove([path]);
      }
      const { error } = await supabase.from('purchase_quotations').delete().eq('id', quotation.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Cotización eliminada'); invalidate(); closeAll(); },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          Cotizaciones
          <span className={styles.badge}>{(details.quotations || []).length}</span>
        </h3>
        <button onClick={() => setModalOpen(true)} className={styles.actionBtn}>
          <i className="bx bx-plus"></i>
          <span>Adjuntar cotización</span>
        </button>
      </div>

      <QuotationsTable
        quotations={details.quotations || []}
        onApprove={q => { setSelected(q); setApproveOpen(true); }}
        onDelete={q => { setSelected(q); setDeleteOpen(true); }}
      />

      <QuotationFormModal
        isOpen={isModalOpen}
        onClose={closeAll}
        onSubmit={data => addMutation.mutate(data)}
        suppliers={suppliers}
        isLoading={addMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isApproveOpen}
        onClose={closeAll}
        onConfirm={() => selected && approveMutation.mutate(selected.id)}
        title="Aprobar cotización"
        message={`¿Aprobar la cotización de ${selected?.supplier_name}? Esto asignará el proveedor a la orden.`}
        confirmText="Sí, aprobar"
        isLoading={approveMutation.isPending}
        variant="primary"
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={closeAll}
        onConfirm={() => selected && deleteMutation.mutate(selected)}
        title="Eliminar cotización"
        message={`¿Eliminar la cotización de ${selected?.supplier_name}?`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};