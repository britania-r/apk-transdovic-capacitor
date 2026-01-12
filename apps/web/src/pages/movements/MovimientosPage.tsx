// File: apps/web/src/pages/movements/MovimientosPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { MovimientosTable } from './MovimientosTable';
import { MovimientoFormModal } from './MovimientoFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import type { ItfRate } from '../settings/ItfPage';
import styles from '../users/UsersPage.module.css';

export interface Movement {
  id: string;
  movement_date: string;
  movement_type: string;
  amount: number;
  commission: number;
  itf_amount: number;
  currency: string;
  description?: string;
  voucher_url?: string;
  is_verified: boolean;
  origin_account_name?: string;
  destination_account_name?: string;
  registered_by_user: string;
  verified_by_user?: string;
}

export const MovimientosPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isVerifyConfirmOpen, setVerifyConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false); // Estado para el modal de borrado
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  
  const queryClient = useQueryClient();

  const { data: movements, isLoading: l1 } = useQuery<Movement[]>({ queryKey: ['movements'], queryFn: async () => {
    const { data, error } = await getSupabase().rpc('get_movements_list');
    if (error) throw error;
    return data;
  }});
  const { data: accounts, isLoading: l2 } = useQuery<CompanyAccount[]>({ queryKey: ['company_accounts'], queryFn: async () => {
    const { data, error } = await getSupabase().rpc('get_company_accounts_with_bank');
    if (error) throw error;
    return data;
  }});
  const { data: itfRates, isLoading: l3 } = useQuery<ItfRate[]>({ queryKey: ['itfRates'], queryFn: async () => {
    const { data, error } = await getSupabase().from('itf_rates').select('*');
    if (error) throw error;
    return data;
  }});

  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['movements'] });
    queryClient.invalidateQueries({ queryKey: ['company_accounts'] });
    setFormModalOpen(false);
    setVerifyConfirmOpen(false);
    setDeleteConfirmOpen(false); // Cerrar modal de borrado
    setSelectedMovement(null);
  };
  const handleError = (error: any) => toast.error(`Error: ${error.message}`);

  const createMutation = useMutation({ mutationFn: (vars: any) => getSupabase().rpc('create_movement', vars), onSuccess: () => handleSuccess('Movimiento creado exitosamente'), onError: handleError });
  const updateMutation = useMutation({ mutationFn: (vars: any) => getSupabase().rpc('update_movement_details', vars), onSuccess: () => handleSuccess('Movimiento actualizado'), onError: handleError });
  const verifyMutation = useMutation({ mutationFn: (id: string) => getSupabase().rpc('verify_movement', { p_movement_id: id }), onSuccess: () => handleSuccess('Movimiento verificado'), onError: handleError });
  
  // Mutación para eliminar el movimiento
  const deleteMutation = useMutation({
    mutationFn: (id: string) => getSupabase().rpc('delete_movement', { p_movement_id: id }),
    onSuccess: () => handleSuccess('Movimiento eliminado y saldos revertidos'),
    onError: handleError
  });

  const handleFormSubmit = (data: any) => {
    if (data.p_movement_id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleVerifyConfirm = () => {
    if (selectedMovement) {
      verifyMutation.mutate(selectedMovement.id);
    }
  };

  // Manejadores para abrir el modal de borrado y confirmar la acción
  const handleOpenDeleteModal = (mov: Movement) => {
    setSelectedMovement(mov);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedMovement) {
      deleteMutation.mutate(selectedMovement.id);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Movimientos</h1>
        <button onClick={() => { setSelectedMovement(null); setFormModalOpen(true); }} className={styles.addButton} disabled={l1 || l2 || l3}>
          <i className='bx bx-plus'></i> Registrar Movimiento
        </button>
      </header>
      
      {(l1 || l2 || l3) && <p>Cargando datos...</p>}

      {movements && 
        <MovimientosTable
          movements={movements}
          onEdit={(mov) => { setSelectedMovement(mov); setFormModalOpen(true); }}
          onVerify={(mov) => { setSelectedMovement(mov); setVerifyConfirmOpen(true); }}
          onDelete={handleOpenDeleteModal} // Pasar la función a la tabla
        />
      }

      {(accounts && itfRates && isFormModalOpen) &&
        <MovimientoFormModal
          isOpen={isFormModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          movementToEdit={selectedMovement}
          accounts={accounts}
          itfRates={itfRates}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      }
      
      <ConfirmationModal
        isOpen={isVerifyConfirmOpen}
        onClose={() => setVerifyConfirmOpen(false)}
        onConfirm={handleVerifyConfirm}
        title="Confirmar Verificación"
        message="¿Estás seguro de que quieres marcar este movimiento como verificado? Esta acción es definitiva."
        isLoading={verifyMutation.isPending}
      />
      
      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este movimiento? Esta acción revertirá los montos en las cuentas bancarias asociadas."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};