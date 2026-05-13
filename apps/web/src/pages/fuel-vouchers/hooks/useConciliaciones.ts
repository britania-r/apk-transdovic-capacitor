// File: apps/web/src/pages/fuel-vouchers/hooks/useConciliaciones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import * as XLSX from 'xlsx';
import type { FuelVoucher } from './useFuelVouchers';

// --- Tipos ---
export interface Reconciliation {
  id: string;
  filename: string;
  total_rows: number;
  ok_count: number;
  discrepancy_count: number;
  only_excel_count: number;
  only_system_count: number;
  created_at: string;
}

export interface ReconRow {
  id: string;
  status: 'ok' | 'discrepancia' | 'solo_excel' | 'solo_sistema';
  excel_data: ExcelParsed | null;
  voucher_id: string | null;
  diffs: Diff[] | null;
}

export interface ExcelParsed {
  placa: string;
  documento: string;
  fecha: string;       // yyyy-MM-dd
  fecha_original: string;
  hora: string;
  kilometraje: number;
  volumen: number;
  precio: number;
  total: number;
  factura: string;
  estacion: string;
}

export interface Diff {
  field: string;
  excel: string | number;
  sistema: string | number;
}

// --- Helpers de parseo ---
const parseDateValue = (raw: any): { iso: string; original: string } => {
  if (!raw && raw !== 0) return { iso: '', original: '' };

  // Si es número → serial de Excel (días desde 1900-01-01)
  if (typeof raw === 'number') {
    // Excel epoch: 1899-12-30 (ajuste por bug de Excel con 1900 bisiesto)
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + raw * 86400000);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return { iso: `${y}-${m}-${d}`, original: `${d}/${m}/${y}` };
  }

  // Si es string con formato dd/mm/yyyy
  const str = String(raw).trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return {
      iso: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      original: str,
    };
  }

  // Si ya viene como yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return { iso: str, original: `${d}/${m}/${y}` };
  }

  return { iso: '', original: str };
};

const num = (v: any): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const normalizeStr = (s: string | null | undefined): string =>
  (s || '').trim().toUpperCase().replace(/[-\s]/g, '');

export const parseExcelFile = (buffer: ArrayBuffer): ExcelParsed[] => {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  return raw.map(row => {
    const fechaRaw = row['Fecha'];
    const { iso, original } = parseDateValue(fechaRaw);
    return {
      placa: String(row['Placa'] || '').trim().toUpperCase(),
      documento: String(row['Documento'] || '').trim(),
      fecha: iso,
      fecha_original: original,
      hora: String(row['Hora'] || '').trim(),
      kilometraje: num(row['Kilometraje']),
      volumen: num(row['Volumen']),
      precio: num(row['Precio']),
      total: num(row['Total']),
      factura: String(row['Nro.Factura'] || row['Nro. Factura'] || '').trim(),
      estacion: String(row['Estación'] || row['Estacion'] || '').trim(),
    };
  });
};

// --- Lógica de cruce ---
export const runReconciliation = (
  excelRows: ExcelParsed[],
  vouchers: FuelVoucher[]
) => {
  const results: {
    status: 'ok' | 'discrepancia' | 'solo_excel' | 'solo_sistema';
    excel_data: ExcelParsed | null;
    voucher_id: string | null;
    diffs: Diff[] | null;
  }[] = [];

  // Set para rastrear vouchers que ya matchearon
  const matchedVoucherIds = new Set<string>();

  // Por cada fila del Excel, buscar match en vouchers
  for (const ex of excelRows) {
    const match = vouchers.find(v =>
      !matchedVoucherIds.has(v.id) &&
      normalizeStr(v.plate) === normalizeStr(ex.placa) &&
      normalizeStr(v.dispatch_note) === normalizeStr(ex.documento) &&
      normalizeStr(v.invoice) === normalizeStr(ex.factura) &&
      v.voucher_date === ex.fecha
    );

    if (!match) {
      results.push({ status: 'solo_excel', excel_data: ex, voucher_id: null, diffs: null });
      continue;
    }

    matchedVoucherIds.add(match.id);

    // Comparar valores numéricos
    const diffs: Diff[] = [];

    const vKm = Number(match.mileage || 0);
    const vGal = Number(match.gallons || 0);
    const vAmt = Number(match.amount || 0);
    const vPpg = Number(match.price_per_gal || 0);

    if (Math.abs(vKm - ex.kilometraje) > 0.01) {
      diffs.push({ field: 'Kilometraje', excel: ex.kilometraje, sistema: vKm });
    }
    if (Math.abs(vGal - ex.volumen) > 0.001) {
      diffs.push({ field: 'Galones', excel: ex.volumen, sistema: vGal });
    }
    if (Math.abs(vAmt - ex.total) > 0.01) {
      diffs.push({ field: 'Importe', excel: ex.total, sistema: vAmt });
    }
    if (Math.abs(vPpg - ex.precio) > 0.01) {
      diffs.push({ field: 'Precio/Gln', excel: ex.precio, sistema: vPpg });
    }

    if (diffs.length > 0) {
      results.push({ status: 'discrepancia', excel_data: ex, voucher_id: match.id, diffs });
    } else {
      results.push({ status: 'ok', excel_data: ex, voucher_id: match.id, diffs: null });
    }
  }

  // Vouchers sin match → solo_sistema
  for (const v of vouchers) {
    if (!matchedVoucherIds.has(v.id)) {
      results.push({
        status: 'solo_sistema',
        excel_data: null,
        voucher_id: v.id,
        diffs: null,
      });
    }
  }

  const ok_count = results.filter(r => r.status === 'ok').length;
  const discrepancy_count = results.filter(r => r.status === 'discrepancia').length;
  const only_excel_count = results.filter(r => r.status === 'solo_excel').length;
  const only_system_count = results.filter(r => r.status === 'solo_sistema').length;

  return { results, ok_count, discrepancy_count, only_excel_count, only_system_count };
};

// --- API calls ---
const fetchReconciliations = async (): Promise<Reconciliation[]> => {
  const { data, error } = await getSupabase().rpc('get_reconciliations_list');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchReconDetail = async (id: string): Promise<ReconRow[]> => {
  const { data, error } = await getSupabase().rpc('get_reconciliation_detail', {
    p_reconciliation_id: id,
  });
  if (error) throw new Error(error.message);
  return data || [];
};

interface SavePayload {
  filename: string;
  total_rows: number;
  ok_count: number;
  discrepancy_count: number;
  only_excel_count: number;
  only_system_count: number;
  rows: any[];
}

const saveReconciliation = async (p: SavePayload): Promise<string> => {
  const { data, error } = await getSupabase().rpc('insert_reconciliation', {
    p_filename: p.filename,
    p_total_rows: p.total_rows,
    p_ok_count: p.ok_count,
    p_discrepancy_count: p.discrepancy_count,
    p_only_excel_count: p.only_excel_count,
    p_only_system_count: p.only_system_count,
    p_rows: p.rows,
  });
  if (error) throw new Error(error.message);
  return data as string;
};

const deleteReconciliation = async (id: string) => {
  const { error } = await getSupabase()
    .from('fuel_reconciliations')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Hooks ---
export const useConciliaciones = () => {
  const qc = useQueryClient();

  const { data: reconciliations = [], isLoading } = useQuery<Reconciliation[], Error>({
    queryKey: ['fuel_reconciliations'],
    queryFn: fetchReconciliations,
  });

  const saveMutation = useMutation({
    mutationFn: saveReconciliation,
    onSuccess: () => {
      toast.success('Conciliación guardada');
      qc.invalidateQueries({ queryKey: ['fuel_reconciliations'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReconciliation,
    onSuccess: () => {
      toast.success('Conciliación eliminada');
      qc.invalidateQueries({ queryKey: ['fuel_reconciliations'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  return { reconciliations, isLoading, saveMutation, deleteMutation };
};

export const useReconDetail = (id: string | null) => {
  return useQuery<ReconRow[], Error>({
    queryKey: ['fuel_reconciliation_detail', id],
    queryFn: () => fetchReconDetail(id!),
    enabled: !!id,
  });
};