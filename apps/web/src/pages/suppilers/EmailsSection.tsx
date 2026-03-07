// File: apps/web/src/pages/suppliers/EmailsSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { Email } from './SuppliersDetailsPage';
import { EmailsTable } from './EmailsTable';
import { EmailFormModal } from './EmailFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './SectionStyles.module.css';

interface Props { supplierId: string; initialEmails: Email[]; }

export const EmailsSection = ({ supplierId, initialEmails }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Email | null>(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
  const close = () => { setModalOpen(false); setConfirmOpen(false); setSelected(null); };

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string; email: string; notes: string }) => {
      const { id, ...rest } = data;
      const payload = { ...rest, supplier_id: supplierId };
      const q = id
        ? getSupabase().from('supplier_emails').update(payload).eq('id', id)
        : getSupabase().from('supplier_emails').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(v.id ? 'Email actualizado' : 'Email agregado'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_emails').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Email eliminado'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionCount}>{initialEmails.length} email{initialEmails.length !== 1 ? 's' : ''}</span>
        <button onClick={() => { setSelected(null); setModalOpen(true); }} className={styles.addBtn}>
          <i className="bx bx-plus"></i> Agregar email
        </button>
      </div>

      <EmailsTable
        emails={initialEmails}
        onEdit={e => { setSelected(e); setModalOpen(true); }}
        onDelete={e => { setSelected(e); setConfirmOpen(true); }}
      />

      <EmailFormModal
        isOpen={isModalOpen}
        onClose={close}
        onSubmit={d => upsertMutation.mutate(d)}
        emailToEdit={selected}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={close}
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
        title="Eliminar email"
        message={`¿Eliminar el email "${selected?.email}"?`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};