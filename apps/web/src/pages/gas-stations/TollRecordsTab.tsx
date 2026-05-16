// File: apps/web/src/pages/gas-stations/TollRecordsTab.tsx
import { useState, useMemo, useRef } from 'react';
import type { TollRecord } from './hooks/useTollRecords';
import { Pagination } from '../../components/ui/Pagination';
import tableStyles from '../../components/ui/Table.module.css';
import tabStyles from '../fuel-vouchers/ValesTabs.module.css';
import styles from '../users/UsersPage.module.css';

interface Props {
  records: TollRecord[];
  isLoading: boolean;
  hasFilters: boolean;
}

const ITEMS_PER_PAGE = 50;

const formatDate = (isoDate: string): string => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

export const TollRecordsContent = ({ records, isLoading, hasFilters }: Props) => {
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  // Reset page cuando cambian los records
  useMemo(() => setPage(1), [records]);

  const paged = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return records.slice(start, start + ITEMS_PER_PAGE);
  }, [records, page]);

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando registros...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-upload"></i>
        <span>{hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay registros. Sube un Excel de COVISOL o COMSATEL.'}</span>
      </div>
    );
  }

  return (
    <>
      {/* Tabla desktop */}
      <div ref={tableRef} className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Placa</th>
              <th>Peaje</th>
              <th style={{ textAlign: 'center' }}>Fuente</th>
              <th style={{ textAlign: 'center' }}>Monto</th>
              <th>Vía</th>
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(r => (
              <tr key={r.id}>
                <td>{formatDate(r.transit_date)}</td>
                <td><span className={tableStyles.userName}>{r.plate}</span></td>
                <td>{r.peaje_name || r.station_name || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`${tabStyles.statusBadge} ${r.source === 'covisol' ? tabStyles.statusExcel : tabStyles.statusOk}`}>
                    {r.source === 'covisol' ? 'COVISOL' : 'COMSATEL'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.toll_amount ? `S/. ${Number(r.toll_amount).toFixed(2)}` : '—'}
                </td>
                <td>{r.via || '—'}</td>
                <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {r.source_file || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className={tableStyles.cardList}>
        {paged.map(r => (
          <div key={r.id} className={tableStyles.card}>
            <div className={tableStyles.cardTop}>
              <div className={tableStyles.cardLeft}>
                <div className={tableStyles.userInfo}>
                  <span className={tableStyles.userName}>{r.plate}</span>
                  <span className={tableStyles.userEmail}>{formatDate(r.transit_date)}</span>
                </div>
              </div>
              <span className={`${tabStyles.statusBadge} ${r.source === 'covisol' ? tabStyles.statusExcel : tabStyles.statusOk}`}>
                {r.source === 'covisol' ? 'COVISOL' : 'COMSATEL'}
              </span>
            </div>
            <div className={tableStyles.cardMeta}>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Peaje</span>
                <span className={tableStyles.metaValue}>{r.peaje_name || r.station_name || '—'}</span>
              </div>
              <div className={tableStyles.metaItem}>
                <span className={tableStyles.metaLabel}>Monto</span>
                <span className={tableStyles.metaValue}>{r.toll_amount ? `S/. ${Number(r.toll_amount).toFixed(2)}` : '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalItems={records.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
        scrollRef={tableRef as React.RefObject<HTMLElement>}
      />
    </>
  );
};