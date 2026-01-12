// File: apps/web/src/pages/purchases/ItemsSection.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { PurchaseItemForm } from './PurchaseItemForm';
import { PurchaseItemsTable } from './PurchaseItemsTable';
import { PurchaseItemEditModal } from './PurchaseItemEditModal'; // Importamos el nuevo modal
import styles from './PurchasesDetailsPage.module.css';
import type { PurchaseOrderDetails, PurchaseOrderItem } from './PurchasesDetailsPage';
import type { ProductWithDetails } from '../products/ProductsPage';

// --- Funciones para obtener datos ---
const fetchProducts = async (): Promise<ProductWithDetails[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_products_with_details');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchVehicles = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('vehicles').select('id, plate').order('plate');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchBotiquinItems = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('botiquin_items').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchServices = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('servicios').select('id, name').order('name');
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

  const { data: products, isLoading: pLoad } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: vehicles, isLoading: vLoad } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
  const { data: botiquinItems, isLoading: bLoad } = useQuery({ queryKey: ['botiquin_items'], queryFn: fetchBotiquinItems });
  const { data: services, isLoading: sLoad } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

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
      toast.success('Ítem actualizado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', details.id] });
      setEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const canEditItems = ['REQUERIMIENTO', 'ORDEN DE COMPRA', 'ORDEN DE SERVICIO'].includes(details.status);
  const isLoadingAllData = pLoad || vLoad || bLoad || sLoad;

  const handleOpenEditModal = (item: PurchaseOrderItem) => {
    setItemToEdit(item);
    setEditModalOpen(true);
  };

  if (isLoadingAllData) {
    return <p>Cargando datos para la sección de ítems...</p>;
  }

  return (
    <>
      <div className={styles.workflowSection}>
        <h2>Agregar Ítems a la Orden</h2>
        {canEditItems ? (
          <PurchaseItemForm
            orderId={details.id}
            purchaseType={details.purchase_type}
            orderType={details.order_type}
            products={products || []}
            vehicles={vehicles || []}
            botiquinItems={botiquinItems || []}
            services={services || []}
          />
        ) : (
          <p>La edición de ítems está bloqueada en el estado actual: <strong>{details.status}</strong>.</p>
        )}
      </div>

      <div className={styles.workflowSection}>
        <h2>Ítems en la Orden</h2>
        <PurchaseItemsTable
          items={details.items || []}
          orderId={details.id}
          canEdit={canEditItems}
          onEdit={handleOpenEditModal}
        />
      </div>

      <PurchaseItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={updateItemMutation.mutate}
        itemToEdit={itemToEdit}
        isLoading={updateItemMutation.isPending}
      />
    </>
  );
};