import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { useOperations, type Operation } from './hooks/useOperations';
import { OperationsTable } from './OperationsTable';
import { OperationFormModal } from './OperationFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UsersPage.module.css';

// Cargar cuentas para el modal
const fetchAccounts = async () => {
  const { data } = await getSupabase().rpc('get_company_accounts_with_bank');
  return (data || []) as CompanyAccount[];
};

export const OperationsPage = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

  const { operations, isLoading: loadingOps, saveMutation, deleteMutation } = useOperations();

  const { data: accounts, isLoading: loadingAccs } = useQuery({ 
    queryKey: ['company_accounts'], 
    queryFn: fetchAccounts 
  });

  const isLoading = loadingOps || loadingAccs;

  // --- HANDLERS ---
  const handleCreate = () => {
    setSelectedOp(null);
    setIsFormOpen(true);
  };

  const handleEdit = (op: Operation) => {
    setSelectedOp(op);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (op: Operation) => {
    setSelectedOp(op);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedOp) {
      deleteMutation.mutate(selectedOp.id, {
        onSuccess: () => setIsDeleteOpen(false)
      });
    }
  };

  // Esta función recibe el payload LIMPIO desde el Modal
  const handleFormSubmit = (cleanData: any) => {
    saveMutation.mutate(cleanData, {
        onSuccess: (responseId) => {
            setIsFormOpen(false);
            
            // LÓGICA DE REDIRECCIÓN PARA MÚLTIPLES
            // Si el flag is_multiple es true y estamos creando (no editando), vamos al detalle.
            if (cleanData.p_is_multiple && !cleanData.p_id) {
                // responseId es el UUID que retorna el RPC save_operation
                if (responseId) {
                    navigate(`/operaciones/${responseId}`);
                }
            }
        }
    });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Registro de Operaciones</h1>
        <button onClick={handleCreate} className={styles.addButton} disabled={isLoading}>
          <i className='bx bx-plus'></i> Nueva Operación
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {operations && (
        <OperationsTable 
            operations={operations} 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
        />
      )}

      {/* MODAL DE FORMULARIO */}
      {accounts && isFormOpen && (
        <OperationFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSubmit}
          isLoading={saveMutation.isPending}
          opToEdit={selectedOp}
          accounts={accounts}
        />
      )}

      {/* MODAL DE ELIMINAR */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de eliminar esta operación? Si es una caja chica, el saldo se revertirá."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};