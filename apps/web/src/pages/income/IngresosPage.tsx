import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@transdovic/shared';

import { IngresosTable } from './IngresosTable';
import { IngresoFormModal } from './IngresoFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UsersPage.module.css';

export interface IncomeRecord {
  id: string;
  income_date: string;
  amount: number;
  payment_type: 'Transferencia' | 'Cheque' | 'Bancarizacion' | 'Abono por devolución';
  reference_number?: string;
  invoice_url?: string;
  account_display: string;
  destination_account_id: string; // IMPORTANTE: Necesario para el formulario de edición
  user_name: string;
  income_type: 'Factura Única' | 'Varias Facturas';
  movement_number?: string;
  operation_number?: string; // Agregado para poder editarlo
  description?: string;      // Agregado para poder editarlo
}

const fetchIncomeRecords = async (): Promise<IncomeRecord[]> => {
  const { data, error } = await getSupabase().rpc('get_income_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchCompanyAccounts = async (): Promise<CompanyAccount[]> => {
  const { data, error } = await getSupabase().rpc('get_company_accounts_with_bank');
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteIncome = async (id: string) => {
  const { error } = await getSupabase().rpc('delete_income', { p_income_id: id });
  if (error) throw new Error(error.message);
};

export const IngresosPage = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  
  // Usamos este estado tanto para Eliminar como para Editar
  const [selectedIncome, setSelectedIncome] = useState<IncomeRecord | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: incomes, isLoading: isLoadingIncomes } = useQuery({ queryKey: ['incomes'], queryFn: fetchIncomeRecords });
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({ queryKey: ['company_accounts'], queryFn: fetchCompanyAccounts });

  const handleMutationSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['incomes'] });
    queryClient.invalidateQueries({ queryKey: ['company_accounts'] });
    handleCloseModals();
  };
  const handleMutationError = (error: Error) => toast.error(`Error: ${error.message}`);

  // --- CREAR ---
  const createMutation = useMutation({
    mutationFn: async (params: any) => {
      const { data, error } = await getSupabase().rpc('register_income', params);
      if (error) throw new Error(error.message);
      return { newId: data, incomeType: params.p_income_type };
    },
    onSuccess: ({ newId, incomeType }) => {
      handleCloseModals();
      if (incomeType === 'Varias Facturas') {
        toast.success('Registro maestro creado. Ahora añade las facturas.');
        navigate(`/ingresos/${newId}`);
      } else {
        handleMutationSuccess('Ingreso registrado exitosamente');
      }
    },
    onError: handleMutationError,
  });

  // --- EDITAR ---
  const updateMutation = useMutation({
    mutationFn: async (params: any) => {
      const { error } = await getSupabase().rpc('update_income', params);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => handleMutationSuccess('Ingreso actualizado correctamente'),
    onError: handleMutationError,
  });

  // --- ELIMINAR ---
  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => handleMutationSuccess('Ingreso eliminado y saldo revertido'),
    onError: handleMutationError,
  });

  const handleCloseModals = () => { 
    setFormModalOpen(false); 
    setConfirmModalOpen(false); 
    setSelectedIncome(null); 
  };

  // Abrir modal de CREAR
  const handleOpenCreateModal = () => {
    setSelectedIncome(null);
    setFormModalOpen(true);
  };

  // Abrir modal de EDITAR
  const handleOpenEditModal = (income: IncomeRecord) => {
    setSelectedIncome(income);
    setFormModalOpen(true);
  };

  // Abrir modal de ELIMINAR
  const handleOpenDeleteModal = (income: IncomeRecord) => { 
    setSelectedIncome(income); 
    setConfirmModalOpen(true); 
  };

// Manejador centralizado del formulario
  const handleFormSubmit = (data: any) => {
    if (selectedIncome) {
      // UPDATE
      // Mapeamos explícitamente para asegurar que coincida con la RPC
      updateMutation.mutate({
        p_income_id: selectedIncome.id,
        p_income_date: data.p_income_date,
        p_amount: data.p_amount,
        p_payment_type: data.p_payment_type,
        p_destination_account_id: data.p_destination_account_id,
        p_income_type: data.p_income_type, // <--- Importante incluirlo si la RPC lo pide
        p_reference_number: data.p_reference_number,
        p_invoice_url: data.p_invoice_url,
        p_description: data.p_description,
        p_operation_number: data.p_operation_number,
        p_movement_number: data.p_movement_number
      });
    } else {
      // CREATE
      createMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => { if (selectedIncome) deleteMutation.mutate(selectedIncome.id); };
  
  const isLoading = isLoadingIncomes || isLoadingAccounts;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Registro de Ingresos</h1>
        <button onClick={handleOpenCreateModal} className={styles.addButton} disabled={isLoading}>
          <i className='bx bx-plus'></i> Registrar Ingreso
        </button>
      </header>

      {isLoading && <p>Cargando datos...</p>}
      
      {incomes && (
        <IngresosTable 
            incomes={incomes} 
            onEdit={handleOpenEditModal} 
            onDelete={handleOpenDeleteModal} 
        />
      )}
      
      {accounts && (
        <IngresoFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          accounts={accounts}
          isLoading={createMutation.isPending || updateMutation.isPending}
          incomeToEdit={selectedIncome}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar este ingreso? Esta acción revertirá el monto del saldo de la cuenta.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};