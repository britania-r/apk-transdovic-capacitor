// File: apps/web/src/pages/fuel-vouchers/ValesTable.tsx
import { useState, useRef } from 'react';
import type { FuelVoucher } from './hooks/useFuelVouchers';
import { getVoucherSignedUrl } from './hooks/useFuelVouchers';
import { Pagination } from '../../components/ui/Pagination';
import styles from '../../components/ui/Table.module.css';

interface Props {
  vouchers: FuelVoucher[];
  onEdit: (v: FuelVoucher) => void;
  onDelete: (v: FuelVoucher) => void;
}

const ITEMS_PER_PAGE = 50;

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const fmtTime = (t: string) => t.slice(0, 5);

const fmtCurrency = (v: number | null | undefined) => {
  if (v === null || v === undefined) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
};

const fmtNumber = (v: number | null | undefined, decimals = 3) => {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(decimals);
};

const handleViewFile = async (path: string) => {
  try {
    const url = await getVoucherSignedUrl(path);
    window.open(url, '_blank');
  } catch {
    alert('No se pudo obtener el archivo');
  }
};

export const ValesTable = ({ vouchers, onEdit, onDelete }: Props) => {
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = vouchers.slice(start, start + ITEMS_PER_PAGE);

  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper} ref={tableRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Placa</th>
              <th>N° Despacho</th>
              <th>Kilometraje</th>
              <th>Galones</th>
              <th>Importe</th>
              <th>S/ /Gln</th>
              <th>Factura</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(v => (
              <tr key={v.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{fmtDate(v.voucher_date)}</span>
                      <span className={styles.userEmail}>{fmtTime(v.voucher_time)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                    {v.plate}
                  </span>
                </td>
                <td>{v.dispatch_note || '—'}</td>
                <td className={styles.monoCell}>{fmtNumber(v.mileage, 3)}</td>
                <td className={styles.monoCell}>{fmtNumber(v.gallons, 3)}</td>
                <td className={styles.monoCell}>{fmtCurrency(v.amount)}</td>
                <td className={styles.monoCell}>{fmtCurrency(v.price_per_gal)}</td>
                <td>{v.invoice || '—'}</td>
                <td>
                  <div className={styles.actions}>
                    {v.attachment && (
                      <button
                        onClick={() => handleViewFile(v.attachment!)}
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        title="Ver archivo adjunto"
                      >
                        <i className="bx bx-file"></i>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(v)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(v)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ── */}
      <div className={styles.cardList}>
        {paginated.map(v => (
          <div key={v.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{fmtDate(v.voucher_date)} — {fmtTime(v.voucher_time)}</span>
                  <span className={styles.userEmail}>{v.dispatch_note || 'Sin N° despacho'}</span>
                </div>
              </div>
              <span className={`${styles.roleBadge} ${styles.roleGerente}`}>
                {v.plate}
              </span>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Kilometraje</span>
                <span className={styles.metaValue}>{fmtNumber(v.mileage, 3)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Galones</span>
                <span className={styles.metaValue}>{fmtNumber(v.gallons, 3)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Importe</span>
                <span className={styles.metaValue}>{fmtCurrency(v.amount)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>S/ /Gln</span>
                <span className={styles.metaValue}>{fmtCurrency(v.price_per_gal)}</span>
              </div>
              {v.invoice && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Factura</span>
                  <span className={styles.metaValue}>{v.invoice}</span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              {v.attachment && (
                <button
                  onClick={() => handleViewFile(v.attachment!)}
                  className={`${styles.cardBtn} ${styles.editBtn}`}
                >
                  <i className="bx bx-file"></i> Archivo
                </button>
              )}
              <button
                onClick={() => onEdit(v)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(v)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Paginación ── */}
      <Pagination
        currentPage={page}
        totalItems={vouchers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
        scrollRef={tableRef as React.RefObject<HTMLElement>}
      />
    </>
  );
};