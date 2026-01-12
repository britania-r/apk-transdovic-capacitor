import { Fragment } from 'react';
import styles from '../users/UserTable.module.css'; 
import type { LedgerRow } from '../../hooks/useAccountStatement';

interface Props {
  transactions: LedgerRow[];
  currency: string;
}

export const AccountStatementTable = ({ transactions, currency }: Props) => {
  
  const formatMoney = (amount: number) => {
    const locale = currency === 'USD' ? 'en-US' : 'es-PE';
    const formatted = new Intl.NumberFormat(locale, { 
        style: 'currency', currency: currency, minimumFractionDigits: 2
    }).format(amount);
    return currency === 'USD' ? formatted.replace('$', '$ ') : formatted;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th style={{width:'25%'}}>Descripción Banco</th> {/* Col B Excel */}
            <th>Detalle Admin</th> {/* Nueva Columna Operations.detail */}
            <th>N° Mov.</th>
            <th>Documento</th> {/* Factura o Voucher */}
            <th style={{ textAlign: 'right', color: '#ef4444' }}>Debe</th>
            <th style={{ textAlign: 'right', color: '#f59e0b' }}>ITF</th>
            <th style={{ textAlign: 'right', color: '#059669' }}>Haber</th>
            <th style={{ textAlign: 'right', color: '#111827' }}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No hay movimientos en este periodo.</td></tr>
          ) : (
            transactions.map((row) => (
              <Fragment key={row.id}>
                {/* --- FILA PRINCIPAL --- */}
                <tr style={row.sub_invoices ? { borderBottom: 'none' } : {}}>
                  <td>{formatDate(row.transaction_date)}</td>
                  
                  {/* Descripción Bancaria (Viene del Excel) */}
                  <td style={{ fontSize:'0.9em', color:'#4b5563' }}>
                      {row.description || 'Sin descripción'}
                  </td>

                  {/* Detalle Administrativo (Viene de Operations) */}
                  <td style={{ fontSize:'0.9em', fontStyle:'italic', color:'#2563eb' }}>
                      {row.admin_detail || '-'}
                  </td>

                  <td style={{ fontFamily: 'monospace', color: '#555' }}>
                     {row.movement_number || '-'}
                  </td>

                  {/* Columna Documento (Factura o Estado Múltiple) */}
                  <td>
                      {row.invoice_number && (
                          <span className={styles.badge} style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                              <i className='bx bx-file'></i> {row.invoice_number}
                          </span>
                      )}
                      {row.operation_number && !row.invoice_number && (
                          <span className={styles.badge} style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                              <i className='bx bxs-bank'></i> {row.operation_number}
                          </span>
                      )}
                      {row.sub_invoices && (
                          <span className={styles.badge} style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                              Múltiple ({row.sub_invoices.length})
                          </span>
                      )}
                      {!row.invoice_number && !row.sub_invoices && !row.operation_number && '-'}
                  </td>
                  
                  <td style={{ textAlign: 'right', color: '#ef4444' }}>
                    {row.debe > 0 ? formatMoney(row.debe) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '0.9em' }}>
                    {row.itf > 0 ? formatMoney(row.itf) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669' }}>
                    {row.haber > 0 ? formatMoney(row.haber) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                    {formatMoney(row.saldo)}
                  </td>
                </tr>

                {/* --- FILAS DE SUB-DETALLES (FACTURAS MÚLTIPLES) --- */}
                {row.sub_invoices?.map((sub, idx) => (
                    <tr key={`${row.id}-sub-${idx}`} style={{ backgroundColor: '#f8fafc', fontSize: '0.85em' }}>
                        <td style={{ borderTop: 'none' }}></td>
                        <td style={{ borderTop: 'none' }}></td>
                        
                        {/* Flechita indicando detalle */}
                        <td style={{ borderTop: 'none', textAlign: 'right', color: '#94a3b8' }}>
                            <i className='bx bx-subdirectory-right'></i>
                        </td>
                        
                        <td style={{ borderTop: 'none' }}></td>

                        {/* N° FACTURA INDIVIDUAL (Lo que faltaba) */}
                        <td style={{ borderTop: 'none', fontWeight: 600, color: '#475569' }}>
                             <i className='bx bx-file' style={{fontSize:'0.9em', marginRight:'4px'}}></i>
                             {sub.document_number || '(Sin Doc)'}
                        </td>

                        <td style={{ borderTop: 'none' }}></td>
                        <td style={{ borderTop: 'none' }}></td>
                        
                        {/* Monto Parcial */}
                        <td style={{ textAlign: 'right', color: '#64748b', borderTop: 'none' }}>
                            {formatMoney(sub.amount)}
                        </td>
                        
                        <td style={{ borderTop: 'none' }}></td>
                    </tr>
                ))}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};