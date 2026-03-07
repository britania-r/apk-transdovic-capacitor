// File: apps/web/src/pages/suppliers/ContactsSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { Contact } from './SuppliersDetailsPage';
import { ContactsTable } from './ContactsTable';
import { ContactFormModal } from './ContactFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './SectionStyles.module.css';

interface Props { supplierId: string; initialContacts: Contact[]; }

export const ContactsSection = ({ supplierId, initialContacts }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
  const close = () => { setModalOpen(false); setConfirmOpen(false); setSelected(null); };

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string; contact_type: string; contact_value: string }) => {
      const { id, ...rest } = data;
      const payload = { ...rest, supplier_id: supplierId };
      const q = id
        ? getSupabase().from('supplier_contacts').update(payload).eq('id', id)
        : getSupabase().from('supplier_contacts').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(v.id ? 'Contacto actualizado' : 'Contacto agregado'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Contacto eliminado'); invalidate(); close(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionCount}>{initialContacts.length} contacto{initialContacts.length !== 1 ? 's' : ''}</span>
        <button onClick={() => { setSelected(null); setModalOpen(true); }} className={styles.addBtn}>
          <i className="bx bx-plus"></i> Agregar contacto
        </button>
      </div>

      <ContactsTable
        contacts={initialContacts}
        onEdit={c => { setSelected(c); setModalOpen(true); }}
        onDelete={c => { setSelected(c); setConfirmOpen(true); }}
      />

      <ContactFormModal
        isOpen={isModalOpen}
        onClose={close}
        onSubmit={d => upsertMutation.mutate(d)}
        contactToEdit={selected}
        isLoading={upsertMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={close}
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
        title="Eliminar contacto"
        message={`¿Eliminar el contacto "${selected?.contact_value}"?`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};