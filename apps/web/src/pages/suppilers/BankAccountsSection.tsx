// File: apps/web/src/pages/suppliers/BankAccountsSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { BankAccount } from './SuppliersDetailsPage';
import type { Bank } from '../settings/BanksPage';
import { BankAccountsTable } from './BankAccountsTable';
import { BankAccountFormModal } from './BankAccountFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './SectionStyles.module.css';

interface Props {
  supplierId: string;
  initialBankAccounts: BankAccount[];
  banks: Bank[];
}

export const BankAccountsSection = ({ supplierId, initialBankAccounts, banks }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
  const close = () => { setModalOpen(false); setConfirmOpen(false); setSelected(null); };

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string; bank_id: string; currency: string; account_number: string }) => {
      const { id, ...rest } = data;
      const payload = { ...rest, supplier_id: supplierId };
      const q = id
        ? getSupabase().from('supplier_bank_accounts').update(payload).eq('id', id)
        : getSupabase().from('supplier_bank_accounts').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(v.id ? 'Cuenta actualizada' : 'Cuenta agregada'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_bank_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Cuenta eliminada'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionCount}>{initialBankAccounts.length} cuenta{initialBankAccounts.length !== 1 ? 's' : ''}</span>
        <button onClick={() => { setSelected(null); setModalOpen(true); }} className={styles.addBtn}>
          <i className="bx bx-plus"></i> Agregar cuenta
        </button>
      </div>

      <BankAccountsTable
        accounts={initialBankAccounts}
        onEdit={a => { setSelected(a); setModalOpen(true); }}
        onDelete={a => { setSelected(a); setConfirmOpen(true); }}
      />

      <BankAccountFormModal
        isOpen={isModalOpen}
        onClose={close}
        onSubmit={d => upsertMutation.mutate(d)}
        accountToEdit={selected}
        banks={banks}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={close}
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
        title="Eliminar cuenta"
        message={`¿Eliminar la cuenta ${selected?.account_number}?`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};