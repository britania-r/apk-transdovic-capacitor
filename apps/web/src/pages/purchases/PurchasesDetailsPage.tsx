// File: apps/web/src/pages/purchases/PurchasesDetailsPage.tsx

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { Fragment } from 'react';

import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { ChangeStatusModal } from './ChangeStatusModal';
import { ItemsSection } from './ItemsSection';
import { QuotationsSection } from './QuotationsSection';
import { ConditionsSection } from './ConditionsSection';
import { ShippingSection } from './ShippingSection';
import { AcInconformeSection } from './AcInconformeSection';
import { InvoiceSection } from './InvoiceSection';
import styles from './PurchasesDetailsPage.module.css';
import tabStyles from './PurchaseTabs.module.css';

import type { SupplierInList } from '../suppilers/SuppliersPage';

// Placeholder para la última pestaña
const PaymentSection = () => <div style={{padding: '1rem'}}>Contenido de Pago pendiente.</div>;

// --- TIPOS COMPLETOS Y ACTUALIZADOS ---
export interface PurchaseOrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  currency: string;
  subtotal: number;
  product_id: string | null;
  product_name: string | null;
  product_code: string | null;
  service_description: string | null;
  service_id: string | null;
  service_name: string | null;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  first_aid_item_id: string | null;
  first_aid_item_name: string | null;
  details: string | null;
  manual_code: string | null;
  expiration_date: string | null;
}

export interface Quotation { 
  id: string; 
  supplier_id: string; 
  supplier_name: string; 
  file_url: string; 
  is_approved: boolean; 
  approved_at: string | null; 
  approved_by_name: string | null; 
}

export interface BankAccount { 
  id: string; 
  bank_id: string; 
  bank_name: string; 
  currency: string; 
  account_number: string; 
}

export interface PurchaseOrderDetails {
  id: string; 
  order_code: string; 
  order_date: string; 
  status: string; 
  subtotal: number;
  igv_amount: number;
  total_amount: number;
  purchase_type: string;
  order_type: string; 
  with_quotation: boolean; 
  has_igv: boolean;
  approver_name: string | null; 
  approved_at: string | null;
  supplier: { id: string; trade_name: string; ruc: string; address: string | null; bank_accounts?: BankAccount[] } | null;
  items: PurchaseOrderItem[]; 
  quotations: Quotation[];
  currency: string | null; 
  payment_condition: string | null; 
  credit_days: number | null; 
  supplier_bank_account_id: string | null;
  store_pickup: boolean | null; 
  shipping_agency: string | null;
  invoice_number: string | null; 
  invoice_reception_date: string | null; 
  invoice_emission_date: string | null; 
  invoice_payment_condition: string | null; 
  invoice_file_url: string | null;
}

// --- Funciones de API ---
const fetchPurchaseOrderDetails = async (orderId: string): Promise<PurchaseOrderDetails | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_purchase_order_details', { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data;
};

const fetchSuppliers = async (): Promise<SupplierInList[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_suppliers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

// --- Componente Principal ---
export const PurchasesDetailsPage = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const queryClient = useQueryClient();
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);

  const { data: details, isLoading: isLoadingDetails, error } = useQuery({ 
    queryKey: ['purchase_order_details', purchaseId], 
    queryFn: () => fetchPurchaseOrderDetails(purchaseId!), 
    enabled: !!purchaseId 
  });
  
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({ 
    queryKey: ['suppliers'], 
    queryFn: fetchSuppliers 
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await getSupabase().rpc('change_purchase_order_status', { p_order_id: purchaseId!, p_new_status: newStatus });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estado de la orden actualizado.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', purchaseId] });
      setStatusModalOpen(false);
    },
    onError: (err: Error) => toast.error(`Error al cambiar de estado: ${err.message}`),
  });
  
  const toggleIgvMutation = useMutation({
    mutationFn: async (newIgvStatus: boolean) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update({ has_igv: newIgvStatus })
        .eq('id', purchaseId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración de IGV actualizada.');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', purchaseId] });
    },
    onError: (err: Error) => toast.error(`Error al actualizar IGV: ${err.message}`),
  });

  const isLoading = isLoadingDetails || isLoadingSuppliers;

  if (isLoading) return <p>Cargando detalles de la orden...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;
  if (!details) return <p>Orden de compra no encontrada.</p>;

  return (
    <div className={styles.pageContainer}>
      {/* --- CAMBIO: Pasamos las nuevas props al Header --- */}
      <PurchaseOrderHeader
        details={details}
        onStatusChangeClick={() => setStatusModalOpen(true)}
        isIgvEnabled={details.has_igv}
        onIgvToggle={toggleIgvMutation.mutate}
        isIgvLoading={toggleIgvMutation.isPending}
      />
      
      {/* --- CAMBIO: Eliminamos el div que contenía el toggle de aquí --- */}
      
      <div className={tabStyles.tabsContainer} style={{marginTop: '1rem'}}>
        <Tab.Group defaultIndex={0}>
          <header className={tabStyles.header}>
            <nav className={tabStyles.tabNav}>
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Ítems</button>}</Tab>
              {details.with_quotation && (<Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Cotizaciones</button>}</Tab>)}
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Condiciones de Compra</button>}</Tab>
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Datos de Envío</button>}</Tab>
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>AC Inconforme</button>}</Tab>
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Datos de Factura</button>}</Tab>
              <Tab as={Fragment}>{({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Pago</button>}</Tab>
            </nav>
          </header>

          <div className={tabStyles.tabContent}>
            <Tab.Panels>
              <Tab.Panel><ItemsSection details={details} /></Tab.Panel>
              {details.with_quotation && (<Tab.Panel>{suppliers && <QuotationsSection details={details} suppliers={suppliers} />}</Tab.Panel>)}
              <Tab.Panel><ConditionsSection details={details} /></Tab.Panel>
              <Tab.Panel><ShippingSection details={details} /></Tab.Panel>
              <Tab.Panel><AcInconformeSection details={details} /></Tab.Panel>
              <Tab.Panel><InvoiceSection details={details} /></Tab.Panel>
              <Tab.Panel><PaymentSection /></Tab.Panel>
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>

      <ChangeStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={(newStatus) => changeStatusMutation.mutate(newStatus)}
        currentStatus={details.status}
        isLoading={changeStatusMutation.isPending}
      />
    </div>
  );
};