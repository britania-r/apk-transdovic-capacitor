// File: apps/web/src/pages/farms/ManagersSection.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './FarmDetailsPage.module.css';
import type { FarmManager } from './FarmDetailsPage';

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
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Encargados</h3>
        {!showAddForm && !editingManager && (
          <button
            onClick={() => setShowAddForm(true)}
            className={styles.sectionAddBtn}
          >
            <i className="bx bx-plus"></i>
            Agregar encargado
          </button>
        )}
      </div>

      {/* Formulario inline */}
      {(showAddForm || editingManager) && (
        <ManagerForm
          farmId={farmId}
          managerToEdit={editingManager}
          onDone={() => { setShowAddForm(false); setEditingManager(null); }}
        />
      )}

      {/* Tabla de encargados */}
      {initialManagers.length === 0 ? (
        <p className={styles.sectionEmpty}>No hay encargados registrados</p>
      ) : (
        <div className={styles.miniTableWrapper}>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialManagers.map(manager => (
                <tr key={manager.id}>
                  <td>{manager.name}</td>
                  <td>{manager.phone}</td>
                  <td>
                    <div className={styles.miniActions}>
                      <button
                        onClick={() => setEditingManager(manager)}
                        className={`${styles.miniActionBtn} ${styles.miniEditBtn}`}
                        title="Editar"
                      >
                        <i className="bx bx-pencil"></i>
                      </button>
                      <button
                        onClick={() => setDeletingManager(manager)}
                        className={`${styles.miniActionBtn} ${styles.miniDeleteBtn}`}
                        title="Eliminar"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deletingManager}
        onClose={() => setDeletingManager(null)}
        onConfirm={() => deletingManager && deleteManagerMutation.mutate(deletingManager.id)}
        title="Eliminar encargado"
        message={`¿Estás seguro de eliminar a "${deletingManager?.name}"?`}
        confirmText="Sí, eliminar"
        isLoading={deleteManagerMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

// --- Formulario inline para encargados ---
const ManagerForm = ({
  farmId,
  managerToEdit,
  onDone,
}: {
  farmId: string;
  managerToEdit: FarmManager | null;
  onDone: () => void;
}) => {
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
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    mutate({ farm_id: farmId, name, phone });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineForm}>
      <div className={styles.inlineField}>
        <label className={styles.inlineLabel}>Nombre</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del encargado"
          required
          autoFocus
        />
      </div>
      <div className={styles.inlineField}>
        <label className={styles.inlineLabel}>Teléfono</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Ej. 987654321"
          required
        />
      </div>
      <div className={styles.inlineFormActions}>
        <button type="submit" className={styles.inlineSaveBtn} disabled={isPending}>
          {isPending ? '...' : 'Guardar'}
        </button>
        <button type="button" onClick={onDone} className={styles.inlineCancelBtn}>
          Cancelar
        </button>
      </div>
    </form>
  );
};