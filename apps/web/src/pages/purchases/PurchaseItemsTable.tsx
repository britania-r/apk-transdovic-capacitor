// File: apps/web/src/pages/purchases/PurchaseItemsTable.tsx

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { PurchaseOrderItem } from './PurchasesDetailsPage';
import tableStyles from '../users/UserTable.module.css';

interface Props {
  items: PurchaseOrderItem[];
  orderId: string;
  canEdit: boolean;
  onEdit: (item: PurchaseOrderItem) => void;
}

export const PurchaseItemsTable = ({ items, orderId, canEdit, onEdit }: Props) => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await getSupabase().from('purchase_order_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ítem eliminado de la orden');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', orderId] });
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  if (items.length === 0) return <p style={{ padding: '1rem', textAlign: 'center' }}>Aún no se han agregado ítems a esta orden.</p>;

  const renderItemDescription = (item: PurchaseOrderItem) => {
    if (item.product_name) return <strong>{item.product_name}</strong>;
    if (item.service_description) return <em>{item.service_description}</em>;
    if (item.service_name && item.vehicle_plate) return <>{`Servicio: ${item.service_name}`} <br /> <small>{`Vehículo: ${item.vehicle_plate}`}</small></>;
    if (item.first_aid_item_name && item.vehicle_plate) return <>{`Botiquín: ${item.first_aid_item_name}`} <br /> <small>{`Vehículo: ${item.vehicle_plate}`}</small></>;
    if (item.vehicle_plate) return `Vehículo: ${item.vehicle_plate}`;
    return 'Ítem Genérico';
  };

  const renderItemDetails = (item: PurchaseOrderItem) => {
    const details = [];
    if (item.product_code) details.push(`Cód: ${item.product_code}`);
    if (item.manual_code) details.push(`Cód. Manual: ${item.manual_code}`);
    if (item.details) details.push(`Det: ${item.details}`);
    if (item.expiration_date) {
      const date = new Date(item.expiration_date);
      const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      details.push(`Vence: ${utcDate.toLocaleDateString('es-PE')}`);
    }
    return details.join(' | ') || '-';
  };

  return (
    <div className={tableStyles.tableWrapper}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Detalles Adicionales</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
            {canEdit && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{renderItemDescription(item)}</td>
              <td>{renderItemDetails(item)}</td>
              <td>{item.quantity}</td>
              <td>{item.currency} {Number(item.unit_price).toFixed(2)}</td>
              <td>{item.currency} {Number(item.subtotal).toFixed(2)}</td>
              {canEdit && (
                <td>
                  <div className={tableStyles.actions}>
                    <button onClick={() => onEdit(item)} className={`${tableStyles.actionButton} ${tableStyles.editButton}`} disabled={deleteMutation.isPending} title="Editar Ítem">
                      <i className='bx bx-pencil'></i>
                    </button>
                    <button onClick={() => deleteMutation.mutate(item.id)} className={`${tableStyles.actionButton} ${tableStyles.deleteButton}`} disabled={deleteMutation.isPending} title="Eliminar Ítem">
                      <i className='bx bx-trash'></i>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};