// File: apps/web/src/pages/fuel-vouchers/ConciliacionDetalle.tsx
import { useState, useRef, useMemo } from 'react';
import { useReconDetail, type ReconRow, type Diff } from './hooks/useConciliaciones';
import type { FuelVoucher } from './hooks/useFuelVouchers';
import { Pagination } from '../../components/ui/Pagination';
import tableStyles from '../../components/ui/Table.module.css';
import pageStyles from '../users/UsersPage.module.css';
import tabStyles from './ValesTabs.module.css';

interface Props {
  reconciliationId: string;
  onBack: () => void;
  vouchers: FuelVoucher[];
}

type StatusFilter = 'todos' | 'ok' | 'discrepancia' | 'solo_excel' | 'solo_sistema';

const ITEMS_PER_PAGE = 50;

const STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  discrepancia: 'Discrepancia',
  solo_excel: 'Solo Excel',
  solo_sistema: 'Solo Sistema',
};

const STATUS_STYLE: Record<string, string> = {
  ok: tabStyles.statusOk,
  discrepancia: tabStyles.statusDisc,
  solo_excel: tabStyles.statusExcel,
  solo_sistema: tabStyles.statusSistema,
};

const fmtDate = (d: string) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const fmtCurrency = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '—';
  return `S/ ${Number(v).toFixed(2)}`;
};

const getRowPlaca = (row: ReconRow, vouchers: FuelVoucher[]): string => {
  if (row.excel_data) return row.excel_data.placa;
  if (row.voucher_id) {
    const v = vouchers.find(x => x.id === row.voucher_id);
    return v?.plate || '—';
  }
  return '—';
};

const getRowDespacho = (row: ReconRow, vouchers: FuelVoucher[]): string => {
  if (row.excel_data) return row.excel_data.documento;
  if (row.voucher_id) {
    const v = vouchers.find(x => x.id === row.voucher_id);
    return v?.dispatch_note || '—';
  }
  return '—';
};

const getRowFecha = (row: ReconRow, vouchers: FuelVoucher[]): string => {
  if (row.excel_data) return fmtDate(row.excel_data.fecha);
  if (row.voucher_id) {
    const v = vouchers.find(x => x.id === row.voucher_id);
    return v ? fmtDate(v.voucher_date) : '—';
  }
  return '—';
};

const getRowFactura = (row: ReconRow, vouchers: FuelVoucher[]): string => {
  if (row.excel_data) return row.excel_data.factura || '—';
  if (row.voucher_id) {
    const v = vouchers.find(x => x.id === row.voucher_id);
    return v?.invoice || '—';
  }
  return '—';
};

const DiffsDisplay = ({ diffs }: { diffs: Diff[] }) => (
  <div className={tabStyles.diffCell}>
    {diffs.map((d, i) => (
      <div key={i} className={tabStyles.diffRow}>
        <span className={tabStyles.diffLabel}>{d.field}:</span>
        <span className={tabStyles.diffExcel}>{d.excel}</span>
        <span className={tabStyles.diffArrow}>→</span>
        <span className={tabStyles.diffSistema}>{d.sistema}</span>
      </div>
    ))}
  </div>
);

export const ConciliacionDetalle = ({ reconciliationId, onBack, vouchers }: Props) => {
  const { data: rows = [], isLoading } = useReconDetail(reconciliationId);
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => ({
    ok: rows.filter(r => r.status === 'ok').length,
    discrepancia: rows.filter(r => r.status === 'discrepancia').length,
    solo_excel: rows.filter(r => r.status === 'solo_excel').length,
    solo_sistema: rows.filter(r => r.status === 'solo_sistema').length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === 'todos') return rows;
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const handleFilterChange = (f: StatusFilter) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <>
      {/* Botón volver */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={onBack} className={tabStyles.backBtn}>
          <i className="bx bx-arrow-back"></i>
          Volver a conciliaciones
        </button>
      </div>

      {/* Summary cards */}
      <div className={tabStyles.summaryCards}>
        <div
          className={`${tabStyles.summaryCard} ${filter === 'ok' ? tabStyles.borderOk : ''}`}
          onClick={() => handleFilterChange(filter === 'ok' ? 'todos' : 'ok')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorOk}`}>{counts.ok}</span>
          <span className={tabStyles.summaryLabel}>OK</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${filter === 'discrepancia' ? tabStyles.borderDisc : ''}`}
          onClick={() => handleFilterChange(filter === 'discrepancia' ? 'todos' : 'discrepancia')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorDisc}`}>{counts.discrepancia}</span>
          <span className={tabStyles.summaryLabel}>Discrepancias</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${filter === 'solo_excel' ? tabStyles.borderExcel : ''}`}
          onClick={() => handleFilterChange(filter === 'solo_excel' ? 'todos' : 'solo_excel')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorExcel}`}>{counts.solo_excel}</span>
          <span className={tabStyles.summaryLabel}>Solo Excel</span>
        </div>
        <div
          className={`${tabStyles.summaryCard} ${filter === 'solo_sistema' ? tabStyles.borderSistema : ''}`}
          onClick={() => handleFilterChange(filter === 'solo_sistema' ? 'todos' : 'solo_sistema')}
        >
          <span className={`${tabStyles.summaryNumber} ${tabStyles.colorSistema}`}>{counts.solo_sistema}</span>
          <span className={tabStyles.summaryLabel}>Solo Sistema</span>
        </div>
      </div>

      {isLoading && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando detalle...</span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-check-circle"></i>
          <span>No hay registros en esta categoría</span>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className={tableStyles.tableWrapper} ref={tableRef}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Placa</th>
                  <th>Documento</th>
                  <th>Fecha</th>
                  <th>Factura</th>
                  <th>Diferencias</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.id}>
                    <td>
                      <span className={`${tabStyles.statusBadge} ${STATUS_STYLE[row.status]}`}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`${tableStyles.roleBadge} ${tableStyles.roleGerente}`}>
                        {getRowPlaca(row, vouchers)}
                      </span>
                    </td>
                    <td>{getRowDespacho(row, vouchers)}</td>
                    <td>{getRowFecha(row, vouchers)}</td>
                    <td>{getRowFactura(row, vouchers)}</td>
                    <td>
                      {row.diffs && row.diffs.length > 0 ? (
                        <DiffsDisplay diffs={row.diffs} />
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className={tableStyles.cardList}>
            {paginated.map(row => (
              <div key={row.id} className={tableStyles.card}>
                <div className={tableStyles.cardTop}>
                  <div className={tableStyles.cardLeft}>
                    <div className={tableStyles.userInfo}>
                      <span className={tableStyles.userName}>{getRowPlaca(row, vouchers)}</span>
                      <span className={tableStyles.userEmail}>{getRowDespacho(row, vouchers)}</span>
                    </div>
                  </div>
                  <span className={`${tabStyles.statusBadge} ${STATUS_STYLE[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </div>

                <div className={tableStyles.cardMeta}>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>Fecha</span>
                    <span className={tableStyles.metaValue}>{getRowFecha(row, vouchers)}</span>
                  </div>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>Factura</span>
                    <span className={tableStyles.metaValue}>{getRowFactura(row, vouchers)}</span>
                  </div>
                </div>

                {row.diffs && row.diffs.length > 0 && (
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <DiffsDisplay diffs={row.diffs} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
            scrollRef={tableRef as React.RefObject<HTMLElement>}
          />
        </>
      )}
    </>
  );
};