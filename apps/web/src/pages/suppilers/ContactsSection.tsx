// File: apps/web/src/pages/suppliers/ContactsSection.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import type { Contact } from './SuppliersDetailsPage';
import { ContactsTable } from './ContactsTable';
import { ContactFormModal } from './ContactFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

interface Props { supplierId: string; initialContacts: Contact[]; }
type ContactFormData = Omit<Contact, 'id'>;

export const ContactsSection = ({ supplierId, initialContacts }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const queryClient = useQueryClient();

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['supplier_details', supplierId] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string } & ContactFormData) => {
      const { id, ...formData } = data;
      const dataToSubmit = { ...formData, supplier_id: supplierId };
      const query = id ? getSupabase().from('supplier_contacts').update(dataToSubmit).eq('id', id) : getSupabase().from('supplier_contacts').insert(dataToSubmit);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (data, variables) => handleMutationSuccess(variables.id ? 'Contacto actualizado' : 'Contacto agregado'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('supplier_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => handleMutationSuccess('Contacto eliminado'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { setModalOpen(false); setConfirmOpen(false); setSelectedContact(null); };
  const handleSubmit = (data) => upsertMutation.mutate(data);
  const handleDelete = () => { if (selectedContact) deleteMutation.mutate(selectedContact.id); };

  return (
    <div>
      <div className={styles.tableActions}>
        <button onClick={() => { setSelectedContact(null); setModalOpen(true); }} className={styles.addButton}><i className='bx bx-plus'></i> Agregar Contacto</button>
      </div>
      
      <ContactsTable contacts={initialContacts} onEdit={(contact) => { setSelectedContact(contact); setModalOpen(true); }} onDelete={(contact) => { setSelectedContact(contact); setConfirmOpen(true); }} />
      <ContactFormModal isOpen={isModalOpen} onClose={handleCloseModals} onSubmit={handleSubmit} contactToEdit={selectedContact} isLoading={upsertMutation.isPending} />
      <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDelete} title="Confirmar Eliminación" message={`¿Seguro que quieres eliminar el contacto ${selectedContact?.contact_value}?`} isLoading={deleteMutation.isPending} />
    </div>
  );
};