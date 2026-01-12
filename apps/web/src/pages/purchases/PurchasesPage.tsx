// File: apps/web/src/pages/purchases/PurchasesPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { PurchaseOrdersTable } from './PurchaseOrdersTable';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { SupplierInList } from '../suppliers/SuppliersPage';
import styles from '../users/UsersPage.module.css';

import type { NewPurchaseOrderData } from './PurchaseOrderFormModal';

// --- Tipos ---
export interface PurchaseOrderInList { 
  id: string; 
  order_code: string; 
  order_date: string; 
  status: string; 
  total_amount: number; 
  supplier_name: string;
  // --- ESTA ES LA LÍNEA QUE FALTABA ---
  invoice_number: string | null;
}

// --- Funciones de API ---
const fetchPurchaseOrders = async (): Promise<PurchaseOrderInList[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_purchase_orders_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchSuppliers = async (): Promise<SupplierInList[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_suppliers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const createPurchaseOrder = async (data: NewPurchaseOrderData): Promise<{ id: string }> => {
  const supabase = getSupabase();
  const { data: newOrder, error } = await supabase.from('purchase_orders').insert([data]).select('id').single();
  if (error) throw error;
  return newOrder;
};

const deletePurchaseOrder = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw error;
};

// --- Componente Principal ---
export const PurchasesPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderInList | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: orders, isLoading: isLoadingOrders } = useQuery({ queryKey: ['purchase_orders'], queryFn: fetchPurchaseOrders });
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
    setModalOpen(false);
    setConfirmOpen(false);
    setSelectedOrder(null);
  };

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (newOrder) => {
      handleMutationSuccess('Proceso de compra iniciado. Ahora puedes continuar.');
      navigate(`/purchases/${newOrder.id}`);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => handleMutationSuccess('Orden de Compra eliminada'),
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleFormSubmit = (data: NewPurchaseOrderData) => {
    createMutation.mutate(data);
  };

  const handleDeleteConfirm = () => {
    if (selectedOrder) {
      deleteMutation.mutate(selectedOrder.id);
    }
  };

  const isLoading = isLoadingOrders || isLoadingSuppliers;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Registro de Compras</h1>
        <button 
          onClick={() => setModalOpen(true)} 
          className={styles.addButton} 
          disabled={!suppliers || isLoading}
        >
          <i className='bx bx-plus'></i> Crear Orden de Compra
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {orders && (
        <PurchaseOrdersTable 
          orders={orders} 
          onDelete={(order) => { 
            setSelectedOrder(order); 
            setConfirmOpen(true); 
          }} 
        />
      )}

      {suppliers && (
        <PurchaseOrderFormModal 
          isOpen={isModalOpen} 
          onClose={() => setModalOpen(false)} 
          onSubmit={handleFormSubmit} 
          suppliers={suppliers} 
          isLoading={createMutation.isPending} 
        />
      )}

      <ConfirmationModal 
        isOpen={isConfirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Confirmar Eliminación" 
        message={`¿Estás seguro de que quieres eliminar la orden de compra ${selectedOrder?.order_code}? Esta acción es irreversible.`} 
        isLoading={deleteMutation.isPending} 
      />
    </div>
  );
};