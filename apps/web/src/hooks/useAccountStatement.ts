import { useState, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

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
  description: string; // Descripción del Banco (Excel Col B)
  movement_number: string | null;
  debe: number;
  itf: number;
  haber: number;
  saldo: number;
  
  // Datos cruzados desde Operations
  admin_detail?: string; // Tu descripción manual (Nueva Columna)
  invoice_number?: string; // Factura única
  operation_number?: string; // Voucher manual
  sub_invoices?: SubInvoice[]; // Lista de facturas múltiples
  match_type?: 'MATCH' | null;
}

export const useAccountStatement = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({
    start: `${currentYear}-01-01`, 
    end: new Date().toISOString().split('T')[0]
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // 1. Cargar Cuentas
  const { data: accounts } = useQuery({
    queryKey: ['company_accounts'],
    queryFn: async () => {
      const { data } = await getSupabase().rpc('get_company_accounts_with_bank');
      return (data || []) as CompanyAccount[];
    }
  });

  // 2. Cargar Ledger (Base Bancaria)
  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['ledger', selectedAccountId, dateRange],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      
      const params = {
        p_account_id: selectedAccountId,
        p_start_date: dateRange.start,
        p_end_date: dateRange.end
      };
      
      const { data, error } = await getSupabase().rpc('get_ledger_statement', params);
      if (error) throw error;
      
      // Saldo Inicial
      const { data: balanceData } = await getSupabase()
        .from('transaction_ledger')
        .select('haber, debe, itf')
        .eq('account_id', selectedAccountId)
        .lt('transaction_date', dateRange.start);
      
      let saldoAcumulado = balanceData?.reduce(
        (acc, t) => acc + (t.haber - t.debe - t.itf), 0
      ) || 0;
      
      return (data || []).map((row: any) => {
        saldoAcumulado += (row.haber - row.debe - row.itf);
        return { ...row, saldo: saldoAcumulado };
      }) as LedgerRow[];
    },
    enabled: !!selectedAccountId
  });

  // 3. Cargar Metadata (CRUCE CON OPERATIONS)
  const { data: operationsMeta } = useQuery({
    queryKey: ['operations_meta', selectedAccountId, dateRange],
    queryFn: async () => {
      if (!selectedAccountId) return [];

      const { data, error } = await getSupabase()
        .from('operations')
        .select(`
            movement_number, 
            operation_date, 
            detail, 
            document_number,
            operation_number,
            is_multiple,
            operation_details ( document_number, amount )
        `)
        .eq('account_id', selectedAccountId)
        .gte('operation_date', dateRange.start)
        .lte('operation_date', dateRange.end)
        .not('movement_number', 'is', null);

      if (error) {
          console.error("Error fetching operations meta:", error);
          return [];
      }
      return data;
    },
    enabled: !!selectedAccountId && !!ledgerData
  });

  // 4. MERGE (CRUCE INTELIGENTE)
  const transactions = useMemo(() => {
    if (!ledgerData) return [];
    if (!operationsMeta) return ledgerData;

    const opsMap = new Map();

    operationsMeta.forEach((op: any) => {
        const year = op.operation_date.split('-')[0];
        const key = `${op.movement_number.trim()}-${year}`;
        
        opsMap.set(key, {
            detail: op.detail,
            doc_number: op.document_number,
            op_number: op.operation_number,
            subs: op.is_multiple ? op.operation_details : null
        });
    });

    return ledgerData.map(row => {
      if (!row.movement_number) return row;
      
      const key = `${row.movement_number.trim()}-${row.transaction_year}`;

      if (opsMap.has(key)) {
        const match = opsMap.get(key);
        return {
            ...row,
            admin_detail: match.detail,      
            invoice_number: match.doc_number,
            operation_number: match.op_number,
            sub_invoices: match.subs,
            match_type: 'MATCH'
        };
      }

      return row;
    });

  }, [ledgerData, operationsMeta]);


  // 5. IMPORTAR EXCEL (CORREGIDO: CLAVE 'descripcion')
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
            const getCell = (col: number) => ws[XLSX.utils.encode_cell({ r: rowNum, c: col })]?.v;

            // Col A: Fecha
            const fechaValue = getCell(0); 
            if (!fechaValue) continue;
            
            let fechaISO: string | null = null;
            if (fechaValue instanceof Date) {
                const offset = fechaValue.getTimezoneOffset() * 60000;
                fechaISO = new Date(fechaValue.getTime() - offset).toISOString().split('T')[0];
            } else if (typeof fechaValue === 'string') {
               const parts = fechaValue.trim().split(/[\/\-]/);
               if (parts.length === 3) {
                   fechaISO = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
               }
            }
            if (!fechaISO) continue;

            // Col B: Referencia
            const rawDesc = getCell(1);
            const descText = rawDesc ? String(rawDesc).trim() : 'Sin descripción';

            // Col C, D, E
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

            // --- AQUI ESTÁ LA CORRECCIÓN CLAVE ---
            // Usamos 'descripcion' (español) porque así lo definiste en tu RPC SQL
            formattedData.push({ 
                fecha: fechaISO, 
                descripcion: descText, // <--- CORREGIDO
                debe, 
                itf: itfDebe, 
                num_mvto: numMvto, 
                haber 
            });
          }

          if (formattedData.length === 0) throw new Error('No se encontraron filas válidas.');
          
          const { data: res, error } = await getSupabase().rpc('import_ledger_data', { 
              p_account_id: selectedAccountId, 
              p_transactions: formattedData 
          });
          
          if (error) throw error;
          resolve(res);

        } catch (err) { reject(err); }
      };
      reader.readAsBinaryString(file);
    });

    toast.promise(promise, { 
        loading: 'Importando...', 
        success: (data: any) => { 
            queryClient.invalidateQueries({ queryKey: ['ledger'] }); 
            if (fileInputRef.current) fileInputRef.current.value = ''; 
            return `Importado: ${data.inserted} nuevos registros.`; 
        }, 
        error: (err) => `Error: ${err.message}` 
    });
  };

  // 6. EXPORTAR EXCEL DETALLADO (NUEVO)
  const handleExportExcel = () => {
    if (!transactions || transactions.length === 0) return;

    // Aplanar datos para Excel
    const exportData = transactions.flatMap(row => {
        const baseRow = {
            Fecha: row.transaction_date,
            'Descripción Banco': row.description,
            'Detalle Admin': row.admin_detail || '',
            'N° Movimiento': row.movement_number || '',
            Documento: row.invoice_number || row.operation_number || (row.sub_invoices ? `Múltiple (${row.sub_invoices.length})` : ''),
            Debe: row.debe || 0,
            ITF: row.itf || 0,
            Haber: row.haber || 0,
            Saldo: row.saldo
        };

        // Si hay sub-facturas, creamos filas adicionales
        if (row.sub_invoices && row.sub_invoices.length > 0) {
            const main = { ...baseRow };
            const subs = row.sub_invoices.map(sub => ({
                Fecha: '',
                'Descripción Banco': '',
                'Detalle Admin': '   >>> Factura Detalle', // Indentación visual
                'N° Movimiento': '',
                Documento: sub.document_number || '(Sin Doc)',
                Debe: 0, 
                ITF: 0,
                Haber: sub.amount, // Mostramos monto en Haber visualmente
                Saldo: ''
            }));
            return [main, ...subs];
        }

        return [baseRow];
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Ajustar ancho de columnas (Opcional, mejora visual)
    const wscols = [
        { wch: 12 }, // Fecha
        { wch: 40 }, // Desc Banco
        { wch: 30 }, // Detalle Admin
        { wch: 10 }, // Mov
        { wch: 20 }, // Doc
        { wch: 10 }, // Debe
        { wch: 8 },  // ITF
        { wch: 10 }, // Haber
        { wch: 12 }  // Saldo
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conciliacion");
    
    const accountName = accounts?.find(a => a.id === selectedAccountId)?.bank_name || 'Cuenta';
    const cleanName = accountName.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizar nombre archivo
    XLSX.writeFile(wb, `EdoCta_${cleanName}_${dateRange.start}.xlsx`);
  };

  const cleanNumber = (val: any) => { if (typeof val === 'number') return val; if (!val) return 0; const clean = String(val).replace(/[^0-9.-]/g, ''); return parseFloat(clean) || 0; };

  return {
    selectedAccountId, setSelectedAccountId,
    dateRange, setDateRange,
    accounts, transactions, 
    isLoading: isLoadingLedger, 
    fileInputRef, handleImportExcel,
    handleExportExcel
  };
};