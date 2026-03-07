// File: apps/web/src/pages/suppliers/SuppliersDetailsPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { BankAccountsSection } from './BankAccountsSection';
import { ContactsSection } from './ContactsSection';
import { EmailsSection } from './EmailsSection';
import type { Bank } from '../settings/BanksPage';
import styles from './SuppliersDetailsPage.module.css';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  bank_id: string;
  bank_name: string;
  currency: string;
  account_number: string;
}

export interface Contact {
  id: string;
  contact_type: string;
  contact_value: string;
}

export interface Email {
  id: string;
  email: string;
  notes: string | null;
}

interface SupplierDetails {
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

// ── API ────────────────────────────────────────────────────────────────────

const fetchBanks = async (): Promise<Bank[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('banks').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const TABS = ['Cuentas bancarias', 'Contactos', 'Emails'] as const;
type Tab = typeof TABS[number];

// ── Componente ─────────────────────────────────────────────────────────────

export const SuppliersDetailsPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Cuentas bancarias');

  const { data: supplier, isLoading, error } = useQuery<SupplierDetails | null, Error>({
    queryKey: ['supplier_details', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('get_supplier_details', { p_supplier_id: supplierId });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!supplierId,
  });

  const { data: banks = [] } = useQuery<Bank[], Error>({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  });

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando proveedor...</span>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>{error?.message ?? 'Proveedor no encontrado'}</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/suppliers" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver a proveedores
          </Link>
        </div>

        <div className={styles.headerProfile}>
          <div className={styles.avatar}>
            {getInitials(supplier.trade_name)}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{supplier.trade_name}</h1>
            <span className={styles.legalName}>{supplier.legal_name}</span>
          </div>
        </div>

        <div className={styles.headerGrid}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>RUC</span>
            <span className={styles.headerValue}>{supplier.ruc}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Dirección</span>
            <span className={styles.headerValue}>{supplier.address || '—'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Descripción</span>
            <span className={styles.headerValue}>{supplier.description || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <i className="bx bx-building-house"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Cuentas bancarias</span>
            <span className={styles.statValue}>{supplier.bank_accounts?.length ?? 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="bx bx-phone"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Contactos</span>
            <span className={styles.statValue}>{supplier.contacts?.length ?? 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <i className="bx bx-envelope"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Emails</span>
            <span className={styles.statValue}>{supplier.emails?.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabNav}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'Cuentas bancarias' && (
            <BankAccountsSection
              supplierId={supplier.id}
              initialBankAccounts={supplier.bank_accounts || []}
              banks={banks}
            />
          )}
          {activeTab === 'Contactos' && (
            <ContactsSection
              supplierId={supplier.id}
              initialContacts={supplier.contacts || []}
            />
          )}
          {activeTab === 'Emails' && (
            <EmailsSection
              supplierId={supplier.id}
              initialEmails={supplier.emails || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};