// File: apps/web/src/pages/purchases/PurchasesDetailsPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';

import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { ChangeStatusModal } from './ChangeStatusModal';
import { ItemsSection } from './ItemsSection';
import { QuotationsSection } from './QuotationsSection';
import { ConditionsSection } from './ConditionsSection';
import { ShippingSection } from './ShippingSection';
import { AcInconformeSection } from './AcInconformeSection';
import { InvoiceSection } from './InvoiceSection';
import { PaymentSection } from './PaymentSection';

import type { SupplierInList } from '../suppilers/SuppliersPage';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from './PurchasesDetailsPage.module.css';

// --- Tipos ---
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
  supplier: {
    id: string;
    trade_name: string;
    ruc: string;
    address: string | null;
    bank_accounts?: BankAccount[];
  } | null;
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
  operation_id?: string | null;
}

// --- API ---
const fetchPurchaseOrderDetails = async (orderId: string): Promise<PurchaseOrderDetails | null> => {
  const { data, error } = await getSupabase().rpc('get_purchase_order_details', { p_order_id: orderId } as any);
  if (error) throw new Error(error.message);
  return data;
};

const fetchSuppliers = async (): Promise<SupplierInList[]> => {
  const { data, error } = await getSupabase().rpc('get_suppliers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchAccounts = async (): Promise<CompanyAccount[]> => {
  const { data, error } = await getSupabase().rpc('get_company_accounts_with_bank');
  if (error) throw new Error(error.message);
  return (data || []) as CompanyAccount[];
};

// --- Tab config ---
interface TabConfig {
  key: string;
  label: string;
  icon: string;
  visible: boolean;
}

// --- Componente principal ---
export const PurchasesDetailsPage = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const queryClient = useQueryClient();
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  const { data: details, isLoading: loadingDetails, error } = useQuery({
    queryKey: ['purchase_order_details', purchaseId],
    queryFn: () => fetchPurchaseOrderDetails(purchaseId!),
    enabled: !!purchaseId,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });

  const { data: accounts } = useQuery({
    queryKey: ['company_accounts'],
    queryFn: fetchAccounts,
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await getSupabase().rpc('change_purchase_order_status', {
        p_order_id: purchaseId!,
        p_new_status: newStatus,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estado de la orden actualizado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStatusModalOpen(false);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const toggleIgvMutation = useMutation({
    mutationFn: async (newIgvStatus: boolean) => {
      const { error } = await getSupabase()
        .from('purchase_orders')
        .update({ has_igv: newIgvStatus } as any)
        .eq('id', purchaseId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración de IGV actualizada');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', purchaseId] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  // --- Estados ---
  if (loadingDetails) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando detalles de la orden...</span>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>Orden de compra no encontrada</span>
      </div>
    );
  }

  // Tabs dinámicas
  const tabs: TabConfig[] = [
    { key: 'items', label: 'Ítems', icon: 'bx bx-list-ul', visible: true },
    { key: 'quotations', label: 'Cotizaciones', icon: 'bx bx-file-find', visible: details.with_quotation },
    { key: 'conditions', label: 'Condiciones', icon: 'bx bx-cog', visible: true },
    { key: 'shipping', label: 'Envío', icon: 'bx bx-package', visible: true },
    { key: 'ac_inconforme', label: 'AC Inconforme', icon: 'bx bx-error', visible: true },
    { key: 'invoice', label: 'Factura', icon: 'bx bx-receipt', visible: true },
    { key: 'payment', label: 'Pago', icon: 'bx bx-money', visible: true },
  ];

  const visibleTabs = tabs.filter(t => t.visible);

  // Asegurar que el tab activo sea válido
  if (!visibleTabs.find(t => t.key === activeTab)) {
    setActiveTab(visibleTabs[0]?.key || 'items');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'items':
        return <ItemsSection details={details} />;
      case 'quotations':
        return suppliers ? (
          <QuotationsSection details={details} suppliers={suppliers} />
        ) : (
          <div className={styles.sectionLoading}>
            <i className="bx bx-loader-alt bx-spin"></i>
            <span>Cargando proveedores...</span>
          </div>
        );
      case 'conditions':
        return <ConditionsSection details={details} />;
      case 'shipping':
        return <ShippingSection details={details} />;
      case 'ac_inconforme':
        return <AcInconformeSection details={details} />;
      case 'invoice':
        return <InvoiceSection details={details} />;
      case 'payment':
        return accounts ? (
          <PaymentSection details={details} accounts={accounts} />
        ) : (
          <div className={styles.sectionLoading}>
            <i className="bx bx-loader-alt bx-spin"></i>
            <span>Cargando cuentas bancarias...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <PurchaseOrderHeader
        details={details}
        onStatusChangeClick={() => setStatusModalOpen(true)}
        isIgvEnabled={details.has_igv}
        onIgvToggle={toggleIgvMutation.mutate}
        isIgvLoading={toggleIgvMutation.isPending}
      />

      {/* Tabs propias */}
      <div className={styles.tabsSection}>
        <div className={styles.tabList}>
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {renderTabContent()}
        </div>
      </div>

      <ChangeStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={newStatus => changeStatusMutation.mutate(newStatus)}
        currentStatus={details.status}
        orderType={details.order_type}
        withQuotation={details.with_quotation}
        isLoading={changeStatusMutation.isPending}
      />
    </div>
  );
};