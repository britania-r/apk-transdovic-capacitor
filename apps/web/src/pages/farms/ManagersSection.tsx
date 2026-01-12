// File: apps/web/src/pages/farms/ManagersSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './FarmDetailsPage.module.css';
import type { FarmManager } from './FarmDetailsPage'; // Importaremos el tipo desde el padre

// ... (Aquí irían los componentes internos ManagerTable y ManagerForm, si los quieres separar también)

interface Props {
  farmId: string;
  initialManagers: FarmManager[];
}

export const ManagersSection = ({ farmId, initialManagers }: Props) => {
  const [editingManager, setEditingManager] = useState<FarmManager | null>(null);
  const [deletingManager, setDeletingManager] = useState<FarmManager | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const deleteManagerMutation = useMutation({
    mutationFn: async (managerId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('farm_managers').delete().eq('id', managerId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Encargado eliminado');
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
      setDeletingManager(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className={styles.managersCard}>
      <header className={styles.managersHeader}>
        <h2>Encargados</h2>
        {!showAddForm && !editingManager && (
          <button onClick={() => setShowAddForm(true)} className={styles.addButton}><i className='bx bx-plus'></i> Agregar Encargado</button>
        )}
      </header>
      {(showAddForm || editingManager) && (
        <ManagerForm
          farmId={farmId}
          managerToEdit={editingManager}
          onDone={() => { setShowAddForm(false); setEditingManager(null); }}
        />
      )}
      {initialManagers && initialManagers.length > 0 ? (
        <ManagersTable managers={initialManagers} onEdit={setEditingManager} onDelete={setDeletingManager} />
      ) : (<p>No hay encargados registrados.</p>)}
      
      <ConfirmationModal
        isOpen={!!deletingManager}
        onClose={() => setDeletingManager(null)}
        onConfirm={() => deletingManager && deleteManagerMutation.mutate(deletingManager.id)}
        title="Confirmar Eliminación"
        message={`¿Seguro que quieres eliminar a ${deletingManager?.name}?`}
        isLoading={deleteManagerMutation.isPending}
      />
    </section>
  );
};

const ManagersTable = ({ managers, onEdit, onDelete }: { managers: FarmManager[], onEdit: (m: FarmManager) => void, onDelete: (m: FarmManager) => void }) => (
  <div className={styles.managersTableWrapper}>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {managers.map(manager => (
          <tr key={manager.id}>
            <td>{manager.name}</td>
            <td>{manager.phone}</td>
            <td>
              <div className={styles.actions}>
                <button onClick={() => onEdit(manager)} className={`${styles.actionButton} ${styles.editButton}`}><i className='bx bx-pencil'></i></button>
                <button onClick={() => onDelete(manager)} className={`${styles.actionButton} ${styles.deleteButton}`}><i className='bx bx-trash'></i></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Componente para el Formulario de Encargados ---
const ManagerForm = ({ farmId, managerToEdit, onDone }: { farmId: string, managerToEdit: FarmManager | null, onDone: () => void }) => {
  const [name, setName] = useState(managerToEdit?.name || '');
  const [phone, setPhone] = useState(managerToEdit?.phone || '');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: { farm_id: string; name: string; phone: string }) => {
      const supabase = getSupabase();
      const query = managerToEdit
        ? supabase.from('farm_managers').update({ name: payload.name, phone: payload.phone }).eq('id', managerToEdit.id)
        : supabase.from('farm_managers').insert(payload);
      const { error } = await query;
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`Encargado ${managerToEdit ? 'actualizado' : 'creado'}`);
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    mutate({ farm_id: farmId, name, phone });
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.managerForm}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del encargado" required autoFocus />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono" required />
      <button type="submit" className={styles.addButton} disabled={isPending}>{isPending ? '...' : 'Guardar'}</button>
      <button type="button" onClick={onDone} className={styles.cancelButton}>Cancelar</button>
    </form>
  );
};