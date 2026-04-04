import { Fragment, useState } from 'react';
import type { LedgerRow } from '../../hooks/useAccountStatement';
import tableStyles from '../../components/ui/Table.module.css';
import styles from './AccountStatementTable.module.css';

interface Props {
  transactions: LedgerRow[];
  currency: string;
  isUSD: boolean;
  ratesMap: Map<string, number>;
  onOpenOverride: (transaction: LedgerRow) => void;
}

const fmtMoney = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-PE';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  return currency === 'USD' ? formatted.replace('$', '$ ') : formatted;
};

const fmtDate = (s: string) => {
  if (!s) return '—';
  const p = s.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
};

export const AccountStatementTable = ({
  transactions, currency, isUSD, ratesMap, onOpenOverride,
}: Props) => {
  if (transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-receipt"></i>
        <span>No hay movimientos en este periodo</span>
      </div>
    );
  }

  const showSoles = isUSD;

  return (
    <>
      {/* ── DESKTOP: Tabla clásica ── */}
      <div className={`${tableStyles.tableWrapper} ${styles.desktopOnly}`}>
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
              {showSoles && (
                <>
                  <th className={styles.colTc}>TC</th>
                  <th className={styles.colDebeSoles}>Debe S/</th>
                  <th className={styles.colItfSoles}>ITF S/</th>
                  <th className={styles.colHaberSoles}>Haber S/</th>
                  <th className={styles.colSaldoSoles}>Saldo S/</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map(row => (
              <Fragment key={row.id}>
                <tr className={row.sub_invoices ? styles.rowNoBottomBorder : ''}>
                  <td>{fmtDate(row.transaction_date)}</td>
                  <td className={styles.cellDescription}>
                    {row.description || 'Sin descripción'}
                  </td>
                  <td className={styles.cellDetail}>{row.admin_detail || '—'}</td>
                  <td className={styles.cellMono}>{row.movement_number || '—'}</td>

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

                  {/* Montos USD */}
                  <td className={styles.cellDebe}>
                    {row.debe > 0 ? fmtMoney(row.debe, currency) : '—'}
                  </td>
                  <td className={styles.cellItf}>
                    {row.itf > 0 ? fmtMoney(row.itf, currency) : '—'}
                  </td>
                  <td className={styles.cellHaber}>
                    {row.haber > 0 ? fmtMoney(row.haber, currency) : '—'}
                  </td>
                  <td className={styles.cellSaldo}>{fmtMoney(row.saldo, currency)}</td>

                  {/* Montos PEN (solo USD) */}
                  {showSoles && (
                    <>
                      <td className={styles.cellTc}>
                        {row.exchange_rate ? (
                          <button
                            className={`${styles.tcButton} ${row.exchange_rate_override ? styles.tcOverride : ''}`}
                            onClick={() => onOpenOverride(row)}
                            title={row.exchange_rate_override ? 'TC personalizado — clic para editar' : 'TC del día — clic para personalizar'}
                          >
                            {row.exchange_rate.toFixed(4)}
                            {row.exchange_rate_override && (
                              <i className="bx bx-edit-alt"></i>
                            )}
                          </button>
                        ) : (
                          <span className={styles.tcEmpty}>—</span>
                        )}
                      </td>
                      <td className={styles.cellDebeSoles}>
                        {row.debe_soles ? fmtMoney(row.debe_soles, 'PEN') : '—'}
                      </td>
                      <td className={styles.cellItfSoles}>
                        {row.itf_soles ? fmtMoney(row.itf_soles, 'PEN') : '—'}
                      </td>
                      <td className={styles.cellHaberSoles}>
                        {row.haber_soles ? fmtMoney(row.haber_soles, 'PEN') : '—'}
                      </td>
                      <td className={styles.cellSaldoSoles}>
                        {row.saldo_soles != null ? fmtMoney(row.saldo_soles, 'PEN') : '—'}
                      </td>
                    </>
                  )}
                </tr>

                {/* Sub-filas */}
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
                    <td className={styles.subAmount}>{fmtMoney(sub.amount, currency)}</td>
                    <td></td>
                    {showSoles && (
                      <>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className={styles.subAmount}>
                          {row.exchange_rate ? fmtMoney(sub.amount * row.exchange_rate, 'PEN') : '—'}
                        </td>
                        <td></td>
                      </>
                    )}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE: Tarjetas ── */}
      <div className={styles.mobileOnly}>
        {transactions.map(row => (
          <div key={row.id} className={styles.card}>
            {/* Card header */}
            <div className={styles.cardHeader}>
              <span className={styles.cardDate}>{fmtDate(row.transaction_date)}</span>
              {row.movement_number && (
                <span className={styles.cardMov}>#{row.movement_number}</span>
              )}
            </div>

            {/* Descripción */}
            <div className={styles.cardDesc}>
              {row.description || 'Sin descripción'}
            </div>
            {row.admin_detail && (
              <div className={styles.cardDetail}>{row.admin_detail}</div>
            )}

            {/* Comprobante */}
            {(row.invoice_number || row.operation_number || row.sub_invoices) && (
              <div className={styles.cardBadges}>
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
              </div>
            )}

            {/* Montos */}
            <div className={styles.cardAmounts}>
              {row.debe > 0 && (
                <div className={styles.cardAmountItem}>
                  <span className={styles.cardAmountLabel}>Debe</span>
                  <span className={styles.cardAmountDebe}>{fmtMoney(row.debe, currency)}</span>
                  {showSoles && row.debe_soles && (
                    <span className={styles.cardAmountSoles}>{fmtMoney(row.debe_soles, 'PEN')}</span>
                  )}
                </div>
              )}
              {row.itf > 0 && (
                <div className={styles.cardAmountItem}>
                  <span className={styles.cardAmountLabel}>ITF</span>
                  <span className={styles.cardAmountItf}>{fmtMoney(row.itf, currency)}</span>
                  {showSoles && row.itf_soles && (
                    <span className={styles.cardAmountSoles}>{fmtMoney(row.itf_soles, 'PEN')}</span>
                  )}
                </div>
              )}
              {row.haber > 0 && (
                <div className={styles.cardAmountItem}>
                  <span className={styles.cardAmountLabel}>Haber</span>
                  <span className={styles.cardAmountHaber}>{fmtMoney(row.haber, currency)}</span>
                  {showSoles && row.haber_soles && (
                    <span className={styles.cardAmountSoles}>{fmtMoney(row.haber_soles, 'PEN')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Saldo */}
            <div className={styles.cardSaldo}>
              <span className={styles.cardSaldoLabel}>Saldo</span>
              <div className={styles.cardSaldoValues}>
                <span className={styles.cardSaldoMain}>{fmtMoney(row.saldo, currency)}</span>
                {showSoles && row.saldo_soles != null && (
                  <span className={styles.cardSaldoSoles}>{fmtMoney(row.saldo_soles, 'PEN')}</span>
                )}
              </div>
            </div>

            {/* TC clickeable en mobile */}
            {showSoles && (
              <div className={styles.cardTc}>
                <button
                  className={`${styles.tcButton} ${row.exchange_rate_override ? styles.tcOverride : ''}`}
                  onClick={() => onOpenOverride(row)}
                >
                  TC: {row.exchange_rate?.toFixed(4) || 'Sin TC'}
                  {row.exchange_rate_override && <i className="bx bx-edit-alt"></i>}
                </button>
              </div>
            )}

            {/* Sub-facturas en mobile */}
            {row.sub_invoices && row.sub_invoices.length > 0 && (
              <div className={styles.cardSubs}>
                {row.sub_invoices.map((sub, idx) => (
                  <div key={idx} className={styles.cardSubItem}>
                    <i className="bx bx-subdirectory-right"></i>
                    <span>{sub.document_number || '(Sin Doc)'}</span>
                    <span className={styles.cardSubAmount}>
                      {fmtMoney(sub.amount, currency)}
                      {showSoles && row.exchange_rate && (
                        <span className={styles.cardAmountSoles}>
                          {fmtMoney(sub.amount * row.exchange_rate, 'PEN')}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};