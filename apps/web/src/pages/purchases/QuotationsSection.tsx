// File: apps/web/src/pages/purchases/QuotationsSection.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderDetails } from './PurchasesDetailsPage';
import type { SupplierInList } from '../suppilers/SuppliersPage';
import { QuotationsTable } from './QuotationsTable';
import { QuotationFormModal } from './QuotationFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

interface Props { 
  details: PurchaseOrderDetails; 
  suppliers: SupplierInList[]; // Necesitamos la lista de todos los proveedores
}

export const QuotationsSection = ({ details, suppliers }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['supplier_details', details.id] }); // Corregido: Es 'supplier_details'
    queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] }); // Invalida la query correcta
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const addMutation = useMutation({
    mutationFn: async ({ supplier_id, file }: { supplier_id: string; file: File }) => {
      const supabase = getSupabase();
      // 1. Subir el archivo
      const filePath = `public/${details.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('quotations').upload(filePath, file);
      if (uploadError) throw uploadError;
      const fileUrl = supabase.storage.from('quotations').getPublicUrl(uploadData.path).data.publicUrl;
      // 2. Insertar el registro
      const { error: insertError } = await supabase.from('purchase_quotations').insert({ purchase_order_id: details.id, supplier_id, file_url: fileUrl });
      if (insertError) throw insertError;
    },
    onSuccess: () => handleMutationSuccess('Cotización agregada'),
    onError: handleMutationError,
  });

  const approveMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const { error } = await getSupabase().rpc('approve_quotation', { p_quotation_id: quotationId, p_order_id: details.id });
      if (error) throw error;
    },
    onSuccess: () => handleMutationSuccess('Cotización aprobada. Proveedor asignado a la orden.'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (quotation: any) => {
      // Lógica para borrar archivo y registro...
    },
    onSuccess: () => handleMutationSuccess('Cotización eliminada'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setModalOpen(false); setConfirmOpen(false); setSelectedQuotation(null); };

  return (
    <div>
      <div className={styles.tableActions}>
        <button onClick={() => setModalOpen(true)} className={styles.addButton}><i className='bx bx-plus'></i> Adjuntar Cotización</button>
      </div>
      
      <QuotationsTable 
        quotations={details.quotations || []} 
        onApprove={(quotation) => {
          if (window.confirm(`¿Estás seguro de aprobar la cotización del proveedor ${quotation.supplier_name}? Esta acción asignará el proveedor a la orden.`)) {
            approveMutation.mutate(quotation.id);
          }
        }}
        onDelete={(quotation) => { setSelectedQuotation(quotation); setConfirmOpen(true); }}
      />
      
      <QuotationFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModals} 
        onSubmit={(data) => addMutation.mutate(data)} 
        suppliers={suppliers} 
        isLoading={addMutation.isPending} 
      />
      
      <ConfirmationModal 
        isOpen={isConfirmOpen} 
        onClose={handleCloseModals} 
        onConfirm={() => deleteMutation.mutate(selectedQuotation)} 
        title="Confirmar Eliminación" 
        message={`¿Seguro que quieres eliminar la cotización de ${selectedQuotation?.supplier_name}?`} 
        isLoading={deleteMutation.isPending} 
      />
    </div>
  );
};