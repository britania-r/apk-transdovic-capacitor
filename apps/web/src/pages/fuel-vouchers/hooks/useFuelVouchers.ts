// File: apps/web/src/pages/fuel-vouchers/hooks/useFuelVouchers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

export interface FuelVoucher {
  id: string;
  voucher_date: string;
  voucher_time: string;
  supplier_code: string;
  dispatch_note: string | null;
  mileage: number | null;
  gallons: number | null;
  amount: number | null;
  price_per_gal: number | null;
  vehicle_id: string;
  plate: string;
  invoice: string | null;
  attachment: string | null;
  notes: string | null;
  created_at: string;
}

interface VoucherPayload {
  p_id?: string | null;
  p_voucher_date: string;
  p_voucher_time: string;
  p_supplier_code: string;
  p_dispatch_note: string | null;
  p_mileage: number | null;
  p_gallons: number | null;
  p_amount: number | null;
  p_vehicle_id: string;
  p_invoice: string | null;
  p_attachment: string | null;
  p_notes: string | null;
}

const fetchVouchers = async (): Promise<FuelVoucher[]> => {
  const { data, error } = await getSupabase().rpc('get_fuel_vouchers_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const upsertVoucher = async (payload: VoucherPayload): Promise<string> => {
  const { data, error } = await getSupabase().rpc('upsert_fuel_voucher', payload);
  if (error) throw new Error(error.message);
  return data as string;
};

const deleteVoucher = async (id: string) => {
  const { error } = await getSupabase().from('fuel_vouchers').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const uploadVoucherFile = async (file: File, voucherId: string): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `${voucherId}/${Date.now()}.${ext}`;
  const { error } = await getSupabase().storage
    .from('fuel-vouchers')
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return path;
};

export const getVoucherFileUrl = (path: string): string => {
  const { data } = getSupabase().storage.from('fuel-vouchers').getPublicUrl(path);
  return data.publicUrl;
};

export const getVoucherSignedUrl = async (path: string): Promise<string> => {
  const { data, error } = await getSupabase().storage
    .from('fuel-vouchers')
    .createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

export const useFuelVouchers = () => {
  const qc = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery<FuelVoucher[], Error>({
    queryKey: ['fuel_vouchers'],
    queryFn: fetchVouchers,
  });

  const saveMutation = useMutation({
    mutationFn: upsertVoucher,
    onSuccess: (_id, variables) => {
      toast.success(variables.p_id ? 'Vale actualizado' : 'Vale registrado exitosamente');
      qc.invalidateQueries({ queryKey: ['fuel_vouchers'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      toast.success('Vale eliminado');
      qc.invalidateQueries({ queryKey: ['fuel_vouchers'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  return { vouchers, isLoading, saveMutation, deleteMutation };
};