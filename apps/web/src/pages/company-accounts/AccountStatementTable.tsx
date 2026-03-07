// File: apps/web/src/pages/account-statement/AccountStatementTable.tsx
import { Fragment } from 'react';
import type { LedgerRow } from '../../hooks/useAccountStatement';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './AccountStatementTable.module.css';

interface Props {
  transactions: LedgerRow[];
  currency: string;
}

const formatMoney = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-PE';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  return currency === 'USD' ? formatted.replace('$', '$ ') : formatted;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  const parts = dateString.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
};

export const AccountStatementTable = ({ transactions, currency }: Props) => {
  if (transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-receipt"></i>
        <span>No hay movimientos en este periodo</span>
      </div>
    );
  }

  return (
    <div className={tableStyles.tableWrapper}>
      <table className={`${tableStyles.table} ${styles.ledgerTable}`}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th className={styles.colDescription}>Descripción Banco</th>
            <th>Detalles</th>
            <th>N° Mov.</th>
            <th>N° Comprobante</th>
            <th className={styles.colDebe}>Debe</th>
            <th className={styles.colItf}>ITF</th>
            <th className={styles.colHaber}>Haber</th>
            <th className={styles.colSaldo}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(row => (
            <Fragment key={row.id}>
              {/* Fila principal */}
              <tr className={row.sub_invoices ? styles.rowNoBottomBorder : ''}>
                <td>{formatDate(row.transaction_date)}</td>

                <td className={styles.cellDescription}>
                  {row.description || 'Sin descripción'}
                </td>

                <td className={styles.cellDetail}>
                  {row.admin_detail || '—'}
                </td>

                <td className={styles.cellMono}>
                  {row.movement_number || '—'}
                </td>

                {/* Comprobante */}
                <td>
                  {row.invoice_number && (
                    <span className={`${styles.badge} ${styles.badgeInvoice}`}>
                      <i className="bx bx-file"></i> {row.invoice_number}
                    </span>
                  )}
                  {row.operation_number && !row.invoice_number && (
                    <span className={`${styles.badge} ${styles.badgeOperation}`}>
                      <i className="bx bxs-bank"></i> {row.operation_number}
                    </span>
                  )}
                  {row.sub_invoices && (
                    <span className={`${styles.badge} ${styles.badgeMultiple}`}>
                      Múltiple ({row.sub_invoices.length})
                    </span>
                  )}
                  {!row.invoice_number && !row.sub_invoices && !row.operation_number && '—'}
                </td>

                <td className={styles.cellDebe}>
                  {row.debe > 0 ? formatMoney(row.debe, currency) : '—'}
                </td>
                <td className={styles.cellItf}>
                  {row.itf > 0 ? formatMoney(row.itf, currency) : '—'}
                </td>
                <td className={styles.cellHaber}>
                  {row.haber > 0 ? formatMoney(row.haber, currency) : '—'}
                </td>
                <td className={styles.cellSaldo}>
                  {formatMoney(row.saldo, currency)}
                </td>
              </tr>

              {/* Sub-filas de facturas múltiples */}
              {row.sub_invoices?.map((sub, idx) => (
                <tr key={`${row.id}-sub-${idx}`} className={styles.subRow}>
                  <td></td>
                  <td></td>
                  <td className={styles.subArrow}>
                    <i className="bx bx-subdirectory-right"></i>
                  </td>
                  <td></td>
                  <td className={styles.subDocument}>
                    <i className="bx bx-file"></i>
                    {sub.document_number || '(Sin Doc)'}
                  </td>
                  <td></td>
                  <td></td>
                  <td className={styles.subAmount}>
                    {formatMoney(sub.amount, currency)}
                  </td>
                  <td></td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};