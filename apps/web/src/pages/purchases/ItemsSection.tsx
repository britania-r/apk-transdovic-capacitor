// File: apps/web/src/pages/purchases/ItemsSection.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { PurchaseItemForm } from './PurchaseItemForm';
import { PurchaseItemsTable } from './PurchaseItemsTable';
import { PurchaseItemEditModal } from './PurchaseItemEditModal';
import { EditExpirationModal } from './EditExpirationModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { PurchaseOrderDetails, PurchaseOrderItem } from './PurchasesDetailsPage';
import styles from './ItemsSection.module.css';

const fetchProducts = async () => {
  const { data, error } = await getSupabase().rpc('get_products_with_details');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchVehicles = async () => {
  const { data, error } = await getSupabase().from('vehicles').select('id, plate').order('plate');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchBotiquinItems = async () => {
  const { data, error } = await getSupabase().from('botiquin_items').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchServices = async () => {
  const { data, error } = await getSupabase().from('servicios').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

interface Props {
  details: PurchaseOrderDetails;
}

export const ItemsSection = ({ details }: Props) => {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PurchaseOrderItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PurchaseOrderItem | null>(null);
  const [expirationItem, setExpirationItem] = useState<PurchaseOrderItem | null>(null);

  const { data: products = [], isLoading: pLoad } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: vehicles = [], isLoading: vLoad } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
  const { data: botiquinItems = [], isLoading: bLoad } = useQuery({ queryKey: ['botiquin_items'], queryFn: fetchBotiquinItems });
  const { data: services = [], isLoading: sLoad } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  const isLoadingData = pLoad || vLoad || bLoad || sLoad;

  const updateItemMutation = useMutation({
    mutationFn: async (itemData: { id: number; quantity: number; unit_price: number }) => {
      const { id, ...updateData } = itemData;
      const { error } = await getSupabase()
        .from('purchase_order_items')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ítem actualizado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setEditModalOpen(false);
      setItemToEdit(null);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await getSupabase().from('purchase_order_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ítem eliminado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setItemToDelete(null);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const canEditItems = ['REQUERIMIENTO', 'COTIZACIÓN', 'PENDIENTE', 'ORDEN DE COMPRA', 'ORDEN DE SERVICIO'].includes(details.status);

  if (isLoadingData) {
    return (
      <div className={styles.loadingState}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {canEditItems ? (
        <div className={styles.formBlock}>
          <h3 className={styles.blockTitle}>Agregar ítems</h3>
          <PurchaseItemForm
            orderId={details.id}
            purchaseType={details.purchase_type}
            orderType={details.order_type}
            currency={details.currency || 'PEN'}
            products={products}
            vehicles={vehicles}
            botiquinItems={botiquinItems}
            services={services}
          />
        </div>
      ) : (
        <div className={styles.lockedNotice}>
          <i className="bx bx-lock-alt"></i>
          <span>La edición de ítems está bloqueada en el estado <strong>{details.status}</strong></span>
        </div>
      )}

      <div className={styles.tableBlock}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>
            Ítems en la orden
            <span className={styles.itemCount}>{(details.items || []).length}</span>
          </h3>
        </div>

        <PurchaseItemsTable
          items={details.items || []}
          canEdit={canEditItems}
          onEdit={item => { setItemToEdit(item); setEditModalOpen(true); }}
          onDelete={item => setItemToDelete(item)}
          onEditExpiration={item => setExpirationItem(item)}
        />
      </div>

      <PurchaseItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setEditModalOpen(false); setItemToEdit(null); }}
        onSubmit={updateItemMutation.mutate}
        itemToEdit={itemToEdit}
        isLoading={updateItemMutation.isPending}
      />

      <EditExpirationModal
        isOpen={!!expirationItem}
        onClose={() => setExpirationItem(null)}
        item={expirationItem}
        orderId={details.id}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
        title="Eliminar ítem"
        message="¿Eliminar este ítem de la orden? Esta acción es irreversible."
        confirmText="Sí, eliminar"
        isLoading={deleteItemMutation.isPending}
        variant="danger"
      />
    </div>
  );
};