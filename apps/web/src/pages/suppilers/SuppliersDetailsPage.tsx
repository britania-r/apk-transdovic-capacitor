// File: apps/web/src/pages/suppliers/SuppliersDetailsPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { Tab } from '@headlessui/react';
import { Fragment } from 'react';

import styles from './SuppliersDetailsPage.module.css';
import tabStyles from '../settings/SettingsPage.module.css'; // Importamos el CSS de Settings

import { BankAccountsSection } from './BankAccountsSection';
import { ContactsSection } from './ContactsSection';
import { EmailsSection } from './EmailsSection';
import type { Bank } from '../settings/BanksPage';

// --- Tipos ---
export interface BankAccount { id: string; bank_id: string; bank_name: string; currency: string; account_number: string; }
export interface Contact { id: string; contact_type: string; contact_value: string; }
export interface Email { id: string; email: string; notes: string | null; }
interface SupplierDetailsData {
  id: string;
  trade_name: string;
  legal_name: string;
  ruc: string;
  address: string | null;
  description: string | null;
  city_id: string | null;
  category_id: string | null;
  bank_accounts: BankAccount[];
  contacts: Contact[];
  emails: Email[];
}

const fetchBanks = async (): Promise<Bank[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('banks').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

// --- Componente Principal ---
export const SuppliersDetailsPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();

  const { data: supplierDetails, isLoading: isLoadingDetails, error: errorDetails } = useQuery<SupplierDetailsData | null, Error>({
    queryKey: ['supplier_details', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const supabase = getSupabase();
      const { data: detailsData, error: rpcError } = await supabase.rpc('get_supplier_details', { p_supplier_id: supplierId });
      if (rpcError) throw new Error(rpcError.message);
      return detailsData;
    },
    enabled: !!supplierId,
  });

  const { data: banks, isLoading: isLoadingBanks } = useQuery<Bank[], Error>({ 
    queryKey: ['banks'], 
    queryFn: fetchBanks 
  });

  const isLoading = isLoadingDetails || isLoadingBanks;

  if (isLoading) return <p>Cargando detalles del proveedor...</p>;
  if (errorDetails) return <p style={{ color: 'red' }}>Error: {errorDetails.message}</p>;
  if (!supplierDetails) return <p>Proveedor no encontrado.</p>;

  return (
    <div className={styles.pageContainer}>
      <Link to="/suppliers" className={styles.backLink}><i className='bx bx-arrow-back'></i> Volver a Proveedores</Link>

      {/* --- CONTENEDOR 1: TARJETA DE DETALLES DEL PROVEEDOR --- */}
      <section className={styles.detailsCard}>
        <h1>{supplierDetails.trade_name}</h1>
        <p className={styles.legalName}>{supplierDetails.legal_name}</p>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}><span className={styles.label}>RUC</span><span className={styles.value}>{supplierDetails.ruc}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Dirección</span><span className={styles.value}>{supplierDetails.address || '-'}</span></div>
          <div className={`${styles.detailItem} ${styles.fullWidth}`}>
            <span className={styles.label}>Descripción</span>
            <span className={styles.value}>{supplierDetails.description || '-'}</span>
          </div>
        </div>
      </section>

      {/* --- CONTENEDOR 2: PESTAÑAS (CORREGIDO) --- */}
      <div className={styles.tabsContainer}>
        <Tab.Group defaultIndex={0}>
          {/* AHORA REPLICAMOS LA ESTRUCTURA EXACTA DE SETTINGS AQUÍ DENTRO */}
          <header className={tabStyles.header}>
            <nav className={tabStyles.tabNav}>
              <Tab as={Fragment}>
                {({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Cuentas de Banco</button>}
              </Tab>
              <Tab as={Fragment}>
                {({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Contactos</button>}
              </Tab>
              <Tab as={Fragment}>
                {({ selected }) => <button className={selected ? `${tabStyles.tabLink} ${tabStyles.active}` : tabStyles.tabLink}>Emails</button>}
              </Tab>
            </nav>
          </header>
          
          <div className={tabStyles.tabContent}>
            <Tab.Panels>
              <Tab.Panel>
                {banks && <BankAccountsSection supplierId={supplierDetails.id} initialBankAccounts={supplierDetails.bank_accounts || []} banks={banks} />}
              </Tab.Panel>
              <Tab.Panel>
                <ContactsSection supplierId={supplierDetails.id} initialContacts={supplierDetails.contacts || []} />
              </Tab.Panel>
              <Tab.Panel>
                <EmailsSection supplierId={supplierDetails.id} initialEmails={supplierDetails.emails || []} />
              </Tab.Panel>
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>
    </div>
  );
};