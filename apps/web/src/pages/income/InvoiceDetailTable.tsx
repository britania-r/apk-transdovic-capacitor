import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useState } from 'react';
import tableStyles from '../users/UserTable.module.css';
import type { InvoiceDetail } from './IngresoDetailPage'; // Importamos el tipo compartido

interface Props {
  details: InvoiceDetail[];
  onEdit: (detail: InvoiceDetail) => void; // <--- Nueva prop
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

export const InvoiceDetailTable = ({ details, onEdit }: Props) => {
  const { id: incomeRecordId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: string) => {
      const { error } = await getSupabase().rpc('delete_invoice_detail', { p_detail_id: detailId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Factura eliminada.');
      queryClient.invalidateQueries({ queryKey: ['incomeDetails', incomeRecordId] });
      setConfirmOpen(false);
      setSelectedDetailId(null);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleDeleteClick = (id: string) => {
    setSelectedDetailId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDetailId) {
      deleteDetailMutation.mutate(selectedDetailId);
    }
  };

  if (!details || details.length === 0) {
    return <p style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Aún no se han añadido facturas a este ingreso.</p>;
  }

  return (
    <>
      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Monto</th>
              <th>N° de Factura</th>
              <th>Registrado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {details.map((detail) => (
              <tr key={detail.id}>
                <td><strong>{formatCurrency(detail.amount)}</strong></td>
                <td>{detail.reference_number || 'N/A'}</td>
                <td>{detail.user_name}</td>
                <td>
                  <div className={tableStyles.actions}>
                    {detail.invoice_url && (
                        <a href={detail.invoice_url} target="_blank" rel="noopener noreferrer" className={tableStyles.actionButton} title="Ver Factura">
                            <i className='bx bxs-file-pdf'></i>
                        </a>
                    )}
                    
                    {/* BOTÓN EDITAR */}
                    <button 
                        onClick={() => onEdit(detail)} 
                        className={`${tableStyles.actionButton} ${tableStyles.editButton}`} 
                        title="Editar Factura"
                    >
                        <i className='bx bx-pencil'></i>
                    </button>

                    {/* BOTÓN ELIMINAR */}
                    <button 
                        onClick={() => handleDeleteClick(detail.id)} 
                        className={`${tableStyles.actionButton} ${tableStyles.deleteButton}`} 
                        title="Eliminar Factura"
                    >
                        <i className='bx bx-trash'></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer."
        isLoading={deleteDetailMutation.isPending}
      />
    </>
  );
};