import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

// --- TIPOS EXACTOS ---
export type OperationType = 'DEPOSITO' | 'RETIRO' | 'GASTO' | 'PAGO' | 'TRANSFERENCIA';
export type DepositSubtype = 'TRANSFERENCIA' | 'CHEQUE' | 'BANCARIZACION' | 'ABONO_DEVOLUCION' | 'VENTANILLA';
export type DocType = 'Ticket de pago' | 'Boleta electronica' | 'Recibo electronico' | 'Formulario 1683';
export type ConceptType = 'Peaje' | 'Sunat' | 'Otro';

export interface OperationDetail {
  id?: string;
  amount: number;
  document_number: string;
  voucher_url?: string;
}

export interface Operation {
  id: string;
  created_at: string;
  operation_date: string;
  operation_type: OperationType;
  amount: number;
  currency: string;
  account_id: string;
  
  movement_number?: string;
  operation_number?: string;
  detail?: string;
  voucher_url?: string;
  
  deposit_subtype?: DepositSubtype;
  destination_account_id?: string;
  
  document_type?: DocType;
  has_igv?: boolean;
  apply_to?: string;
  concept?: ConceptType;
  entity_name?: string;

  is_multiple: boolean;
  
  // Relaciones para mostrar en tabla
  account_name?: string;
  destination_name?: string;
  
  // Metadata cruda (si se necesita)
  account?: any;
  destination_account?: any;
}

export const useOperations = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER OPERACIONES
  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      // CORRECCIÓN DEL QUERY: Hacemos el join correcto para sacar el nombre del banco
      const { data, error } = await getSupabase()
        .from('operations')
        .select(`
            *,
            account:account_id (
                currency, 
                account_number, 
                account_type,
                bank:bank_id ( name ) 
            ),
            dest:destination_account_id (
                currency, 
                account_number, 
                account_type,
                bank:bank_id ( name )
            )
        `)
        .order('operation_date', { ascending: false });
      
      if (error) throw error;
      
      // Mapeo seguro de datos
      return data.map((op: any) => {
        // Formatear nombre de Cuenta Origen
        let accName = 'Cuenta desconocida';
        if (op.account) {
            if (op.account.account_type === 'CAJA') {
                accName = `Caja Chica - ${op.account.currency}`;
            } else {
                // Es banco
                const bankName = op.account.bank?.name || 'Banco';
                accName = `${bankName} ${op.account.currency} - ${op.account.account_number}`;
            }
        }

        // Formatear nombre de Cuenta Destino (si existe)
        let destName = null;
        if (op.dest) {
            if (op.dest.account_type === 'CAJA') {
                destName = `Caja Chica - ${op.dest.currency}`;
            } else {
                const bankName = op.dest.bank?.name || 'Banco';
                destName = `${bankName} ${op.dest.currency} - ${op.dest.account_number}`;
            }
        }

        return {
            ...op,
            account_name: accName,
            destination_name: destName
        };
      }) as Operation[];
    }
  });

  // 2. GUARDAR (CREATE / UPDATE)
  const saveMutation = useMutation({
    mutationFn: async (vars: any) => {
        const { data, error } = await getSupabase().rpc('save_operation', vars);
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        toast.success('Operación guardada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: any) => toast.error(`Error al guardar: ${err.message}`)
  });

  // 3. ELIMINAR
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        // Usamos 'as any' para evitar el error de tipado estricto de TS en la llamada RPC
        const { error } = await getSupabase().rpc('delete_operation', { p_id: id } as any);
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success('Operación eliminada');
        queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: any) => toast.error(`Error al eliminar: ${err.message}`)
  });

  return {
    operations,
    isLoading,
    saveMutation,
    deleteMutation
  };
};