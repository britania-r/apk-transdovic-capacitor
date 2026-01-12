// File: apps/web/src/pages/settings/BotiquinPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

// Importaremos estos componentes en el siguiente paso. Por ahora los nombramos.
import { BotiquinTable } from './BotiquinTable';
import { BotiquinFormModal } from './BotiquinFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../../pages/users/UsersPage.module.css';

// --- Tipos y Funciones de API para Botiquín ---
export interface BotiquinItem {
  id: string;
  name: string;
  created_at: string;
}

const fetchBotiquinItems = async (): Promise<BotiquinItem[]> => {
  const supabase = getSupabase();
  // APUNTAMOS A LA NUEVA TABLA: 'botiquin_items'
  const { data, error } = await supabase.from('botiquin_items').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createBotiquinItem = async ({ name }: { name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('botiquin_items').insert({ name });
  if (error) throw new Error(error.message);
};

const updateBotiquinItem = async ({ id, name }: { id: string; name: string }) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('botiquin_items').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
};

const deleteBotiquinItem = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('botiquin_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Componente Principal de la Página de Botiquín ---
export const BotiquinPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  // Cambiamos el nombre del estado para reflejar la nueva entidad
  const [selectedItem, setSelectedItem] = useState<BotiquinItem | null>(null);
  
  const queryClient = useQueryClient();

  // CAMBIAMOS LA QUERY KEY Y LA FUNCIÓN DE FETCH
  const { data: botiquinItems, isLoading, error } = useQuery<BotiquinItem[], Error>({
    queryKey: ['botiquinItems'],
    queryFn: fetchBotiquinItems,
  });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['botiquinItems'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(error.message);

  const createMutation = useMutation({
    mutationFn: createBotiquinItem,
    onSuccess: () => handleMutationSuccess('Elemento creado exitosamente'),
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: updateBotiquinItem,
    onSuccess: () => handleMutationSuccess('Elemento actualizado exitosamente'),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBotiquinItem,
    onSuccess: () => handleMutationSuccess('Elemento eliminado exitosamente'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => {
    setSelectedItem(null);
    setFormModalOpen(false);
    setConfirmModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (item: BotiquinItem) => {
    setSelectedItem(item);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (item: BotiquinItem) => {
    setSelectedItem(item);
    setConfirmModalOpen(true);
  };

  const handleFormSubmit = (itemData: { id?: string; name: string }) => {
    if (itemData.id) {
      updateMutation.mutate({ id: itemData.id, name: itemData.name });
    } else {
      createMutation.mutate({ name: itemData.name });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };
  
  return (
    <div>
      <header className={styles.pageHeader} style={{ paddingBottom: '1rem' }}>
        <h2>Botiquín</h2>
        <button onClick={handleOpenCreateModal} className={styles.addButton}>
          <i className='bx bx-plus'></i> Crear Elemento
        </button>
      </header>

      {isLoading && <p>Cargando elementos del botiquín...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      
      {botiquinItems && botiquinItems.length > 0 && (
        <BotiquinTable items={botiquinItems} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
      {botiquinItems && botiquinItems.length === 0 && <p>No se encontraron elementos en el botiquín.</p>}

      <BotiquinFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        itemToEdit={selectedItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el elemento "${selectedItem?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};