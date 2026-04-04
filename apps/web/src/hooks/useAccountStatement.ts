import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

// ── Tipos ──

export interface CompanyAccount {
  id: string;
  bank_id: string;
  currency: string;
  account_number: string;
  created_at: string;
  bank_name: string;
  balance: number;
  is_special: boolean;
  account_type: 'BANCO' | 'CAJA';
}

export interface SubInvoice {
  document_number: string;
  amount: number;
}

export interface LedgerRow {
  id: string;
  transaction_date: string;
  transaction_year: number;
  description: string;
  movement_number: string | null;
  debe: number;
  itf: number;
  haber: number;
  saldo: number;

  // Cruce con Operations
  admin_detail?: string;
  invoice_number?: string;
  operation_number?: string;
  sub_invoices?: SubInvoice[];
  match_type?: 'MATCH' | null;

  // Tipo de cambio
  exchange_rate_override?: number | null;
  exchange_rate?: number | null;       // TC efectivo (override o del día)
  debe_soles?: number;
  itf_soles?: number;
  haber_soles?: number;
  saldo_soles?: number;
}

export interface ExchangeRate {
  rate_date: string;
  rate: number;
}

// ── Hook ──

export const useAccountStatement = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({
    start: `${currentYear}-01-01`,
    end: new Date().toISOString().split('T')[0],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // ─── 1. Cuentas ───
  const { data: accounts } = useQuery({
    queryKey: ['company_accounts'],
    queryFn: async () => {
      const { data } = await getSupabase().rpc('get_company_accounts_with_bank');
      return (data || []) as CompanyAccount[];
    },
  });

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);
  const isUSD = selectedAccount?.currency === 'USD';

  // ─── 2. Ledger ───
  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['ledger', selectedAccountId, dateRange],
    queryFn: async () => {
      if (!selectedAccountId) return [];

      const { data, error } = await getSupabase().rpc('get_ledger_statement', {
        p_account_id: selectedAccountId,
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      });
      if (error) throw error;

      // Saldo Inicial
      const { data: balanceData } = await getSupabase()
        .from('transaction_ledger')
        .select('haber, debe, itf')
        .eq('account_id', selectedAccountId)
        .lt('transaction_date', dateRange.start);

      let saldoAcumulado =
        balanceData?.reduce((acc, t) => acc + (t.haber - t.debe - t.itf), 0) || 0;

      return (data || []).map((row: any) => {
        saldoAcumulado += row.haber - row.debe - row.itf;
        return { ...row, saldo: saldoAcumulado };
      }) as LedgerRow[];
    },
    enabled: !!selectedAccountId,
  });

  // ─── 3. Operations Meta (cruce) ───
  const { data: operationsMeta } = useQuery({
    queryKey: ['operations_meta', selectedAccountId, dateRange],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      const { data, error } = await getSupabase()
        .from('operations')
        .select(`
          movement_number, operation_date, detail,
          document_number, operation_number, is_multiple,
          operation_details ( document_number, amount )
        `)
        .eq('account_id', selectedAccountId)
        .gte('operation_date', dateRange.start)
        .lte('operation_date', dateRange.end)
        .not('movement_number', 'is', null);

      if (error) { console.error(error); return []; }
      return data;
    },
    enabled: !!selectedAccountId && !!ledgerData,
  });

  // ─── 4. Tipos de Cambio ───
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchange_rates', selectedAccountId, dateRange],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('get_exchange_rates', {
        p_account_id: selectedAccountId,
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      });
      if (error) throw error;
      return (data || []) as ExchangeRate[];
    },
    enabled: !!selectedAccountId && isUSD,
  });

  // Mapa de TC por fecha para acceso rápido
  const ratesMap = useMemo(() => {
    const map = new Map<string, number>();
    exchangeRates?.forEach(er => map.set(er.rate_date, er.rate));
    return map;
  }, [exchangeRates]);

  // ─── 5. MERGE INTELIGENTE (cruce + TC) ───
  const transactions = useMemo(() => {
    if (!ledgerData) return [];

    // Primero: cruce con operations
    const opsMap = new Map<string, any>();
    operationsMeta?.forEach((op: any) => {
      const year = op.operation_date.split('-')[0];
      const key = `${op.movement_number.trim()}-${year}`;
      opsMap.set(key, {
        detail: op.detail,
        doc_number: op.document_number,
        op_number: op.operation_number,
        subs: op.is_multiple ? op.operation_details : null,
      });
    });

    let saldoSoles = 0;

    return ledgerData.map(row => {
      // Cruce con operations
      let merged = { ...row };
      if (row.movement_number) {
        const key = `${row.movement_number.trim()}-${row.transaction_year}`;
        if (opsMap.has(key)) {
          const m = opsMap.get(key);
          merged = {
            ...merged,
            admin_detail: m.detail,
            invoice_number: m.doc_number,
            operation_number: m.op_number,
            sub_invoices: m.subs,
            match_type: 'MATCH',
          };
        }
      }

      // Tipo de cambio (solo USD)
      if (isUSD) {
        const tc = merged.exchange_rate_override ?? ratesMap.get(row.transaction_date) ?? null;
        const neto = (row.haber - row.debe - row.itf);
        saldoSoles += tc ? neto * tc : 0;

        merged = {
          ...merged,
          exchange_rate: tc,
          debe_soles: tc ? row.debe * tc : undefined,
          itf_soles: tc ? row.itf * tc : undefined,
          haber_soles: tc ? row.haber * tc : undefined,
          saldo_soles: tc ? saldoSoles : undefined,
        };
      }

      return merged;
    });
  }, [ledgerData, operationsMeta, ratesMap, isUSD]);

  // ─── 6. Fechas únicas con movimientos (para el panel de TC) ───
  const uniqueDates = useMemo(() => {
    if (!ledgerData || !isUSD) return [];
    const dates = [...new Set(ledgerData.map(r => r.transaction_date))];
    return dates.sort();
  }, [ledgerData, isUSD]);

  // ─── 7. Mutations de TC ───

  // Guardar TC por fecha individual
  const saveRateMutation = useMutation({
    mutationFn: async ({ date, rate }: { date: string; rate: number }) => {
      const { error } = await getSupabase().rpc('upsert_exchange_rate', {
        p_account_id: selectedAccountId,
        p_rate_date: date,
        p_rate: rate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange_rates', selectedAccountId] });
    },
    onError: (err: any) => toast.error(`Error al guardar TC: ${err.message}`),
  });

  // Guardar TCs en lote
  const saveRatesBatchMutation = useMutation({
    mutationFn: async (rates: { date: string; rate: number }[]) => {
      const { error } = await getSupabase().rpc('upsert_exchange_rates_batch', {
        p_account_id: selectedAccountId,
        p_rates: rates,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange_rates', selectedAccountId] });
      toast.success('Tipos de cambio guardados');
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  // Guardar override de una transacción
  const saveOverrideMutation = useMutation({
    mutationFn: async ({ transactionId, rate }: { transactionId: string; rate: number | null }) => {
      const { error } = await getSupabase().rpc('update_transaction_exchange_rate', {
        p_transaction_id: transactionId,
        p_rate: rate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ledger', selectedAccountId] });
      toast.success('TC actualizado para esta transacción');
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  // Wrappers limpios
  const saveExchangeRate = useCallback(
    (date: string, rate: number) => saveRateMutation.mutate({ date, rate }),
    [saveRateMutation]
  );

  const saveExchangeRatesBatch = useCallback(
    (rates: { date: string; rate: number }[]) => saveRatesBatchMutation.mutate(rates),
    [saveRatesBatchMutation]
  );

  const saveTransactionOverride = useCallback(
    (transactionId: string, rate: number | null) =>
      saveOverrideMutation.mutate({ transactionId, rate }),
    [saveOverrideMutation]
  );

  // ─── 8. Importar Excel (sin cambios) ───
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAccountId) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, cellNF: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

          const formattedData = [];

          for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
            const getCell = (col: number) =>
              ws[XLSX.utils.encode_cell({ r: rowNum, c: col })]?.v;

            const fechaValue = getCell(0);
            if (!fechaValue) continue;

            let fechaISO: string | null = null;
            if (fechaValue instanceof Date) {
              const offset = fechaValue.getTimezoneOffset() * 60000;
              fechaISO = new Date(fechaValue.getTime() - offset).toISOString().split('T')[0];
            } else if (typeof fechaValue === 'string') {
              const parts = fechaValue.trim().split(/[\/\-]/);
              if (parts.length === 3)
                fechaISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            if (!fechaISO) continue;

            const rawDesc = getCell(1);
            const descText = rawDesc ? String(rawDesc).trim() : 'Sin descripción';
            const importe = cleanNumber(getCell(2));
            const itfValor = cleanNumber(getCell(3));
            const rawMov = getCell(4);
            const numMvto = rawMov ? String(rawMov).trim() : null;

            let debe = 0, haber = 0, itfDebe = 0;
            if (importe < 0) debe = Math.abs(importe);
            else if (importe > 0) haber = importe;
            if (itfValor < 0) itfDebe = Math.abs(itfValor);
            else if (itfValor > 0) haber += itfValor;

            if (debe === 0 && haber === 0) continue;

            formattedData.push({
              fecha: fechaISO,
              descripcion: descText,
              debe,
              itf: itfDebe,
              num_mvto: numMvto,
              haber,
            });
          }

          if (formattedData.length === 0) throw new Error('No se encontraron filas válidas.');

          const { data: res, error } = await getSupabase().rpc('import_ledger_data', {
            p_account_id: selectedAccountId,
            p_transactions: formattedData,
          });

          if (error) throw error;
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsBinaryString(file);
    });

    toast.promise(promise, {
      loading: 'Importando...',
      success: (data: any) => {
        qc.invalidateQueries({ queryKey: ['ledger'] });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return `Importado: ${data.inserted} nuevos registros.`;
      },
      error: (err: any) => `Error: ${err.message}`,
    });
  };

  // ─── 9. Exportar Excel (actualizado con soles) ───
  const handleExportExcel = () => {
    if (!transactions || transactions.length === 0) return;

    const exportData = transactions.flatMap(row => {
      const baseRow: Record<string, any> = {
        Fecha: row.transaction_date,
        'Descripción Banco': row.description,
        'Detalle Admin': row.admin_detail || '',
        'N° Movimiento': row.movement_number || '',
        Documento: row.invoice_number || row.operation_number || (row.sub_invoices ? `Múltiple (${row.sub_invoices.length})` : ''),
        'Debe USD': row.debe || 0,
        'ITF USD': row.itf || 0,
        'Haber USD': row.haber || 0,
        'Saldo USD': row.saldo,
      };

      // Agregar columnas en soles si es cuenta USD
      if (isUSD) {
        baseRow['TC'] = row.exchange_rate || '';
        baseRow['Debe S/'] = row.debe_soles ?? '';
        baseRow['ITF S/'] = row.itf_soles ?? '';
        baseRow['Haber S/'] = row.haber_soles ?? '';
        baseRow['Saldo S/'] = row.saldo_soles ?? '';
      }

      if (row.sub_invoices && row.sub_invoices.length > 0) {
        const subs = row.sub_invoices.map(sub => ({
          Fecha: '',
          'Descripción Banco': '',
          'Detalle Admin': '   >>> Factura Detalle',
          'N° Movimiento': '',
          Documento: sub.document_number || '(Sin Doc)',
          'Debe USD': 0,
          'ITF USD': 0,
          'Haber USD': sub.amount,
          'Saldo USD': '',
          ...(isUSD ? {
            'TC': row.exchange_rate || '',
            'Debe S/': '',
            'ITF S/': '',
            'Haber S/': row.exchange_rate ? sub.amount * row.exchange_rate : '',
            'Saldo S/': '',
          } : {}),
        }));
        return [baseRow, ...subs];
      }

      return [baseRow];
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conciliacion');

    const accountName = accounts?.find(a => a.id === selectedAccountId)?.bank_name || 'Cuenta';
    const cleanName = accountName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `EdoCta_${cleanName}_${dateRange.start}.xlsx`);
  };

  const cleanNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(clean) || 0;
  };

  return {
    // Estado
    selectedAccountId, setSelectedAccountId,
    dateRange, setDateRange,
    // Data
    accounts, transactions, isLoading: isLoadingLedger,
    // Tipo de cambio
    isUSD, exchangeRates, uniqueDates, ratesMap,
    saveExchangeRate, saveExchangeRatesBatch, saveTransactionOverride,
    // Import/Export
    fileInputRef, handleImportExcel, handleExportExcel,
  };
};