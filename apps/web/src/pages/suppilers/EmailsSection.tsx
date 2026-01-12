// File: apps/web/src/pages/suppliers/EmailsSection.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { Email } from './SuppliersDetailsPage';
import { EmailsTable } from './EmailsTable';
import { EmailFormModal } from './EmailFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

interface Props { supplierId: string; initialEmails: Email[]; }
type EmailFormData = Omit<Email, 'id'>;

export const EmailsSection = ({ supplierId, initialEmails }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const queryClient = useQueryClient();

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string } & EmailFormData) => {
      const { id, ...formData } = data;
      const dataToSubmit = { ...formData, supplier_id: supplierId };
      const query = id ? getSupabase().from('supplier_emails').update(dataToSubmit).eq('id', id) : getSupabase().from('supplier_emails').insert(dataToSubmit);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (data, variables) => handleMutationSuccess(variables.id ? 'Email actualizado' : 'Email agregado'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_emails').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => handleMutationSuccess('Email eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setModalOpen(false); setConfirmOpen(false); setSelectedEmail(null); };
  const handleSubmit = (data) => upsertMutation.mutate(data);
  const handleDelete = () => { if (selectedEmail) deleteMutation.mutate(selectedEmail.id); };

  return (
    <div>
      <div className={styles.tableActions}>
        <button onClick={() => { setSelectedEmail(null); setModalOpen(true); }} className={styles.addButton}><i className='bx bx-plus'></i> Agregar Email</button>
      </div>
      
      <EmailsTable emails={initialEmails} onEdit={(email) => { setSelectedEmail(email); setModalOpen(true); }} onDelete={(email) => { setSelectedEmail(email); setConfirmOpen(true); }} />
      <EmailFormModal isOpen={isModalOpen} onClose={handleCloseModals} onSubmit={handleSubmit} emailToEdit={selectedEmail} isLoading={upsertMutation.isPending} />
      <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDelete} title="Confirmar Eliminación" message={`¿Seguro que quieres eliminar el email ${selectedEmail?.email}?`} isLoading={deleteMutation.isPending} />
    </div>
  );
};