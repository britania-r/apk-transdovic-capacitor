import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { GastosRentaTable, type RentExpense } from './GastosRentaTable';
import { GastosRentaFormModal } from './GastosRentaFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UsersPage.module.css';

export const GastosRentaPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 1. Cargar Gastos (Lectura directa simple por ahora)
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['rent_expenses'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('rent_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as RentExpense[];
    }
  });

  // 2. Cargar Cuentas Bancarias (Para el modal)
  const { data: accounts } = useQuery({
    queryKey: ['company_accounts'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('company_bank_accounts').select('*, banks(name)');
      if (error) throw error;
      return data as CompanyAccount[];
    }
  });

  // 3. Mutación Crear Gasto
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await getSupabase().rpc('register_rent_expense', data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Gasto registrado y saldo descontado');
      queryClient.invalidateQueries({ queryKey: ['rent_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['company_accounts'] }); // Actualizar bancos
      queryClient.invalidateQueries({ queryKey: ['pettyCashBalances'] }); // Actualizar caja
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // 4. Mutación Borrar (FUTURO: Implementar RPC de reverso)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // POR AHORA SOLO BORRADO LOGICO O SIMPLE, LUEGO IMPLEMENTAREMOS EL REVERSO DE DINERO
      const { error } = await getSupabase().from('rent_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Registro eliminado (Nota: El saldo no se ha revertido automáticamente aún)');
      queryClient.invalidateQueries({ queryKey: ['rent_expenses'] });
      setIsDeleteOpen(false);
    }
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Gastos Renta</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
          <i className='bx bx-plus'></i> Registrar Gasto
        </button>
      </header>

      {isLoading ? <p>Cargando gastos...</p> : (
        <GastosRentaTable 
          expenses={expenses || []} 
          onDelete={(id) => { setSelectedId(id); setIsDeleteOpen(true); }} 
        />
      )}

      <GastosRentaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        accounts={accounts || []}
        isLoading={createMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => selectedId && deleteMutation.mutate(selectedId)}
        title="Eliminar Gasto"
        message="¿Estás seguro? Nota: Por ahora esto solo borra el registro, no devuelve el dinero a la cuenta."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};