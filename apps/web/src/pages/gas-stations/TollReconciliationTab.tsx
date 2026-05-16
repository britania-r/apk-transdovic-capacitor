// File: apps/web/src/pages/gas-stations/TollReconciliationTab.tsx
import { useState, useMemo, useRef } from 'react';
import type { TollReconciliationRow } from './hooks/useTollRecords';
import { Pagination } from '../../components/ui/Pagination';
import styles from '../users/UsersPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';
import tabStyles from '../fuel-vouchers/ValesTabs.module.css';

interface Props {
  rows: TollReconciliationRow[];
  isLoading: boolean;
  hasFilters: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const ITEMS_PER_PAGE = 50;

const formatDate = (isoDate: string): string => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ok:            { label: 'OK',            className: 'statusOk' },
  discrepancia:  { label: 'Discrepancia',  className: 'statusDisc' },
  solo_covisol:  { label: 'Solo COVISOL',  className: 'statusExcel' },
  solo_comsatel: { label: 'Solo COMSATEL', className: 'statusSistema' },
};

export const TollReconciliationContent = ({
  rows, isLoading, hasFilters, statusFilter, onStatusFilterChange,
}: Props) => {
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    setPage(1);
    if (!statusFilter) return rows;
    return rows.filter(r => r.status === statusFilter);
  }, [rows, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const summary = useMemo(() => {
    const s = { ok: 0, discrepancia: 0, solo_covisol: 0, solo_comsatel: 0, total_covisol: 0 };
    rows.forEach(r => {
      s[r.status] = (s[r.status] || 0) + 1;
      s.total_covisol += Number(r.covisol_total) || 0;
    });
    return s;
  }, [rows]);

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando conciliación...</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-check-double"></i>
        <span>{hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay datos para conciliar. Sube registros de COVISOL y COMSATEL primero.'}</span>
      </div>
    );
  }

  return (
    <>
      {/* Summary cards (4 de estado) */}
      <div className={tabStyles.summaryCards}>
        <div
          className={`${tabStyles.summaryCard} ${statusFilter === 'ok' ? tabStyles.borderOk : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'ok' ? '' : 'ok')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorOk}`}>{summary.ok}</span>
          <span className={tabStyles.summaryLabel}>OK</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${statusFilter === 'discrepancia' ? tabStyles.borderDisc : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'discrepancia' ? '' : 'discrepancia')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorDisc}`}>{summary.discrepancia}</span>
          <span className={tabStyles.summaryLabel}>Discrepancias</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${statusFilter === 'solo_covisol' ? tabStyles.borderExcel : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'solo_covisol' ? '' : 'solo_covisol')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorExcel}`}>{summary.solo_covisol}</span>
          <span className={tabStyles.summaryLabel}>Solo COVISOL</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${statusFilter === 'solo_comsatel' ? tabStyles.borderSistema : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'solo_comsatel' ? '' : 'solo_comsatel')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorSistema}`}>{summary.solo_comsatel}</span>
          <span className={tabStyles.summaryLabel}>Solo COMSATEL</span>
        </div>
      </div>

      {/* Total COVISOL */}
      {summary.total_covisol > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '0 0 0.75rem 0', fontSize: 'var(--font-size-sm)',
          fontWeight: 700, color: 'var(--color-text-secondary)',
        }}>
          Total COVISOL: S/. {summary.total_covisol.toFixed(2)}
        </div>
      )}

      {/* Tabla desktop */}
      <div ref={tableRef} className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Placa</th>
              <th>Peaje</th>
              <th style={{ textAlign: 'center' }}>COVISOL</th>
              <th style={{ textAlign: 'center' }}>COMSATEL</th>
              <th style={{ textAlign: 'center' }}>Monto COVISOL</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r, idx) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ok;
              return (
                <tr key={`${r.transit_date}-${r.plate}-${r.peaje_id}-${idx}`}>
                  <td>{formatDate(r.transit_date)}</td>
                  <td><span className={tableStyles.userName}>{r.plate}</span></td>
                  <td>{r.peaje_name || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.covisol_count}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.comsatel_count}</td>
                  <td style={{ textAlign: 'center' }}>
                    {r.covisol_total > 0 ? `S/. ${Number(r.covisol_total).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`${tabStyles.statusBadge} ${tabStyles[cfg.className]}`}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className={tableStyles.cardList}>
        {paged.map((r, idx) => {
          const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ok;
          return (
            <div key={`m-${r.transit_date}-${r.plate}-${r.peaje_id}-${idx}`} className={tableStyles.card}>
              <div className={tableStyles.cardTop}>
                <div className={tableStyles.cardLeft}>
                  <div className={tableStyles.userInfo}>
                    <span className={tableStyles.userName}>{r.plate}</span>
                    <span className={tableStyles.userEmail}>{formatDate(r.transit_date)}</span>
                  </div>
                </div>
                <span className={`${tabStyles.statusBadge} ${tabStyles[cfg.className]}`}>
                  {cfg.label}
                </span>
              </div>
              <div className={tableStyles.cardMeta}>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Peaje</span>
                  <span className={tableStyles.metaValue}>{r.peaje_name || '—'}</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>COVISOL</span>
                  <span className={tableStyles.metaValue}>{r.covisol_count} pasadas</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>COMSATEL</span>
                  <span className={tableStyles.metaValue}>{r.comsatel_count} pasadas</span>
                </div>
                <div className={tableStyles.metaItem}>
                  <span className={tableStyles.metaLabel}>Monto</span>
                  <span className={tableStyles.metaValue}>
                    {r.covisol_total > 0 ? `S/. ${Number(r.covisol_total).toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
        scrollRef={tableRef as React.RefObject<HTMLElement>}
      />
    </>
  );
};