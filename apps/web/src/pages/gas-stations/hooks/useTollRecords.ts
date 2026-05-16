// File: apps/web/src/pages/gas-stations/hooks/useTollRecords.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import * as XLSX from 'xlsx';
import type { Peaje } from '../PeajesPage';

// ─── Tipos ───

export interface TollRecord {
  id: string;
  source: 'covisol' | 'comsatel';
  transit_date: string;
  transit_datetime: string;
  plate: string;
  peaje_id: string | null;
  peaje_name: string | null;
  station_name: string | null;
  toll_amount: number | null;
  via: string | null;
  categoria: string | null;
  source_file: string | null;
  created_at: string;
}

export interface TollReconciliationRow {
  transit_date: string;
  plate: string;
  peaje_id: string | null;
  peaje_name: string | null;
  covisol_count: number;
  comsatel_count: number;
  covisol_total: number;
  status: 'ok' | 'discrepancia' | 'solo_covisol' | 'solo_comsatel';
}

export interface InsertResult {
  total: number;
  inserted: number;
  skipped: number;
}

// ─── Helpers ───

const parseDatetime = (raw: any): { date: string; datetime: string } => {
  if (!raw && raw !== 0) return { date: '', datetime: '' };

  if (typeof raw === 'number') {
    const epoch = new Date(1899, 11, 30);
    const ms = epoch.getTime() + raw * 86400000;
    const dt = new Date(ms);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, datetime: `${y}-${m}-${d}T${hh}:${mm}:${ss}` };
  }

  const str = String(raw).trim();

  // dd/mm/yyyy hh:mm:ss
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/);
  if (match) {
    const [, dd, mm, yyyy, hh, mi, ss] = match;
    return {
      date: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`,
      datetime: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${hh.padStart(2, '0')}:${mi}:${(ss || '00').padStart(2, '0')}`,
    };
  }

  // dd/mm/yyyy
  const matchDate = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchDate) {
    const [, dd, mm, yyyy] = matchDate;
    return {
      date: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`,
      datetime: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00`,
    };
  }

  // yyyy-mm-dd...
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return { date: str.substring(0, 10), datetime: str.length > 10 ? str : `${str}T00:00:00` };
  }

  return { date: '', datetime: '' };
};

const num = (v: any): number => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const str = (v: any): string => String(v || '').trim();
const normalizeTag = (s: string): string => s.trim().toUpperCase().replace(/\s+/g, ' ');

/** Busca valor de una fila por clave parcial (case-insensitive, sin acentos) */
const findCol = (row: Record<string, any>, ...candidates: string[]): any => {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const norm = candidate.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const found = keys.find(k => {
      const kNorm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm);
    });
    if (found !== undefined && row[found] !== '' && row[found] !== undefined) {
      return row[found];
    }
  }
  return '';
};

const findPeaje = (peajes: Peaje[], stationName: string, source: 'covisol' | 'comsatel'): Peaje | undefined => {
  const normalized = normalizeTag(stationName);
  return peajes.find(p => {
    const tag = source === 'covisol'
      ? normalizeTag(p.tag_covisol || '')
      : normalizeTag(p.tag_comsatel || '');
    return tag === normalized;
  });
};

// ─── Parseadores ───

export const parseCovisolExcel = (buffer: ArrayBuffer, peajes: Peaje[], filename: string) => {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.group('📊 COVISOL Parser Debug');
  console.log('Total filas raw:', raw.length);
  console.log('Headers:', raw.length > 0 ? Object.keys(raw[0]) : 'SIN FILAS');
  console.log('Primera fila completa:', raw[0]);
  console.log('Peajes disponibles:', peajes.map(p => ({ name: p.name, tag_covisol: p.tag_covisol })));
  console.groupEnd();

  const parsed = raw.map((row, idx) => {
    const fechaRaw = findCol(row, 'Fecha de tránsito', 'Fecha de transito', 'Fecha');
    const station = str(findCol(row, 'Estación', 'Estacion'));
    const placa = str(findCol(row, 'Placa')).toUpperCase();
    const peaje = findPeaje(peajes, station, 'covisol');
    const { date, datetime } = parseDatetime(fechaRaw);

    const valorRaw = str(findCol(row, 'Valor Peaje', 'Valor peaje'));
    const tollAmount = num(valorRaw.replace(/[^\d.,]/g, '').replace(',', '.'));

    const { date: compFecha } = parseDatetime(findCol(row, 'Fecha Comprobante'));

    if (idx < 3) {
      console.log(`  Fila ${idx}:`, { fechaRaw, date, datetime, station, placa, peaje_id: peaje?.id });
    }

    return {
      source: 'covisol',
      transit_date: date,
      transit_datetime: datetime,
      plate: placa,
      peaje_id: peaje?.id || '',
      station_name: station,
      toll_amount: String(tollAmount),
      via: str(findCol(row, 'Vía', 'Via')),
      categoria: str(findCol(row, 'Categoría', 'Categoria')),
      comprobante_fecha: compFecha || '',
      comprobante_numero: str(findCol(row, 'N º Comprobante', 'N° Comprobante', 'Nº Comprobante', 'N Comprobante')),
      ruc_concesion: str(findCol(row, 'Ruc concesión', 'Ruc concesion', 'Ruc')),
      tipo_comprobante: str(findCol(row, 'Tipo de Comprobante', 'Tipo Comprobante')),
      hora_llegada: '',
      codigo_externo: '',
      tipo_evento: '',
      sede: '',
      flota: '',
      compania: '',
      velocidad: '',
      ubicacion: '',
      referencia: '',
      conductor: '',
      duracion_evento: '',
      source_file: filename,
    };
  });

  const valid = parsed.filter(r => r.transit_date && r.plate);
  console.log(`✅ COVISOL: ${valid.length} filas válidas de ${parsed.length} total`);
  if (valid.length === 0 && parsed.length > 0) {
    console.warn('⚠️ Todas las filas fueron filtradas. Razones posibles:');
    parsed.slice(0, 5).forEach((r, i) => {
      console.warn(`  Fila ${i}: transit_date="${r.transit_date}", plate="${r.plate}"`);
    });
  }

  return valid;
};

export const parseComsatelExcel = (buffer: ArrayBuffer, peajes: Peaje[], filename: string) => {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.group('📡 COMSATEL Parser Debug');
  console.log('Total filas raw:', raw.length);
  console.log('Headers:', raw.length > 0 ? Object.keys(raw[0]) : 'SIN FILAS');
  console.log('Primera fila completa:', raw[0]);
  console.log('Peajes disponibles:', peajes.map(p => ({ name: p.name, tag_comsatel: p.tag_comsatel })));
  console.groupEnd();

  const parsed = raw.map((row, idx) => {
    const fechaRaw = findCol(row, 'Fecha y Hora de Suceso', 'Fecha Hora Suceso', 'Fecha');
    const descripcion = str(findCol(row, 'Descripción Evento', 'Descripcion Evento'));
    const placa = str(findCol(row, 'Placa')).toUpperCase();
    const peaje = findPeaje(peajes, descripcion, 'comsatel');
    const { date, datetime } = parseDatetime(fechaRaw);
    const { datetime: horaLlegada } = parseDatetime(findCol(row, 'Fecha y Hora de Llegada', 'Fecha Hora Llegada'));

    if (idx < 3) {
      console.log(`  Fila ${idx}:`, { fechaRaw, date, datetime, descripcion, placa, peaje_id: peaje?.id });
    }

    return {
      source: 'comsatel',
      transit_date: date,
      transit_datetime: datetime,
      plate: placa,
      peaje_id: peaje?.id || '',
      station_name: descripcion,
      toll_amount: '',
      via: '',
      categoria: '',
      comprobante_fecha: '',
      comprobante_numero: '',
      ruc_concesion: '',
      tipo_comprobante: '',
      hora_llegada: horaLlegada || '',
      codigo_externo: str(findCol(row, 'Código Externo', 'Codigo Externo')),
      tipo_evento: str(findCol(row, 'Tipo Evento')),
      sede: str(findCol(row, 'Sede')),
      flota: str(findCol(row, 'Flota')),
      compania: str(findCol(row, 'Compañía', 'Compania')),
      velocidad: String(num(findCol(row, 'Velocidad (km/h)', 'Velocidad'))),
      ubicacion: str(findCol(row, 'Ubicación', 'Ubicacion')),
      referencia: str(findCol(row, 'Referencia')),
      conductor: str(findCol(row, 'Conductor')),
      duracion_evento: str(findCol(row, 'Duración de Evento', 'Duracion de Evento', 'Duracion Evento')),
      source_file: filename,
    };
  });

  const valid = parsed.filter(r => r.transit_date && r.plate);
  console.log(`✅ COMSATEL: ${valid.length} filas válidas de ${parsed.length} total`);
  if (valid.length === 0 && parsed.length > 0) {
    console.warn('⚠️ Todas las filas fueron filtradas. Razones posibles:');
    parsed.slice(0, 5).forEach((r, i) => {
      console.warn(`  Fila ${i}: transit_date="${r.transit_date}", plate="${r.plate}"`);
    });
  }

  return valid;
};

// ─── API calls ───

const fetchTollRecords = async (
  dateFrom?: string, dateTo?: string, plate?: string, source?: string
): Promise<TollRecord[]> => {
  const { data, error } = await getSupabase().rpc('get_toll_records', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
    p_plate: plate || null,
    p_source: source || null,
  });
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchReconciliation = async (
  dateFrom?: string, dateTo?: string, plate?: string
): Promise<TollReconciliationRow[]> => {
  const { data, error } = await getSupabase().rpc('get_toll_reconciliation', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
    p_plate: plate || null,
  });
  if (error) throw new Error(error.message);
  return data || [];
};

const insertTollRecords = async (records: any[]): Promise<InsertResult> => {
  const { data, error } = await getSupabase().rpc('insert_toll_records', {
    p_records: records,
  });
  if (error) throw new Error(error.message);
  return data as InsertResult;
};

const deleteTollRecordsByFile = async (sourceFile: string) => {
  const { error } = await getSupabase()
    .from('toll_records')
    .delete()
    .eq('source_file', sourceFile);
  if (error) throw new Error(error.message);
};

// ─── Hooks ───

export const useTollRecords = (
  dateFrom?: string, dateTo?: string, plate?: string, source?: string
) => {
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery<TollRecord[], Error>({
    queryKey: ['toll_records', dateFrom, dateTo, plate, source],
    queryFn: () => fetchTollRecords(dateFrom, dateTo, plate, source),
  });

  const insertMutation = useMutation({
    mutationFn: insertTollRecords,
    onSuccess: (result) => {
      toast.success(`${result.inserted} registros insertados, ${result.skipped} duplicados omitidos`);
      qc.invalidateQueries({ queryKey: ['toll_records'] });
      qc.invalidateQueries({ queryKey: ['toll_reconciliation'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTollRecordsByFile,
    onSuccess: () => {
      toast.success('Registros del archivo eliminados');
      qc.invalidateQueries({ queryKey: ['toll_records'] });
      qc.invalidateQueries({ queryKey: ['toll_reconciliation'] });
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  return { records, isLoading, insertMutation, deleteMutation };
};

export const useTollReconciliation = (
  dateFrom?: string, dateTo?: string, plate?: string
) => {
  const { data: rows = [], isLoading } = useQuery<TollReconciliationRow[], Error>({
    queryKey: ['toll_reconciliation', dateFrom, dateTo, plate],
    queryFn: () => fetchReconciliation(dateFrom, dateTo, plate),
  });

  return { rows, isLoading };
};