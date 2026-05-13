// File: apps/web/src/pages/fuel-vouchers/ConciliacionesList.tsx
import { useState, useRef } from 'react';
import {
  useConciliaciones,
  type Reconciliation,
} from './hooks/useConciliaciones';
import type { FuelVoucher } from './hooks/useFuelVouchers';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Pagination } from '../../components/ui/Pagination';
import tableStyles from '../../components/ui/Table.module.css';
import pageStyles from '../users/UsersPage.module.css';
import tabStyles from './ValesTabs.module.css';

interface Props {
  vouchers: FuelVoucher[];
  onOpenDetail: (id: string) => void;
}

const ITEMS_PER_PAGE = 50;

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const ConciliacionesList = ({ vouchers, onOpenDetail }: Props) => {
  const { reconciliations, isLoading, deleteMutation } = useConciliaciones();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = reconciliations.slice(start, start + ITEMS_PER_PAGE);

  return (
    <>
      {isLoading && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando conciliaciones...</span>
        </div>
      )}

      {!isLoading && reconciliations.length === 0 && (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-check-double"></i>
          <span>No hay conciliaciones realizadas</span>
        </div>
      )}

      {!isLoading && reconciliations.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className={tableStyles.tableWrapper} ref={listRef}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Filas</th>
                  <th>OK</th>
                  <th>Discrepancias</th>
                  <th>Solo Excel</th>
                  <th>Solo Sistema</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDateTime(r.created_at)}</td>
                    <td>
                      <div className={tableStyles.userCell}>
                        <div className={tableStyles.userInfo}>
                          <span className={tableStyles.userName}>{r.filename}</span>
                        </div>
                      </div>
                    </td>
                    <td className={tableStyles.monoCell}>{r.total_rows}</td>
                    <td>
                      <span className={`${tabStyles.statusBadge} ${tabStyles.statusOk}`}>
                        {r.ok_count}
                      </span>
                    </td>
                    <td>
                      <span className={`${tabStyles.statusBadge} ${tabStyles.statusDisc}`}>
                        {r.discrepancy_count}
                      </span>
                    </td>
                    <td>
                      <span className={`${tabStyles.statusBadge} ${tabStyles.statusExcel}`}>
                        {r.only_excel_count}
                      </span>
                    </td>
                    <td>
                      <span className={`${tabStyles.statusBadge} ${tabStyles.statusSistema}`}>
                        {r.only_system_count}
                      </span>
                    </td>
                    <td>
                      <div className={tableStyles.actions}>
                        <button
                          onClick={() => onOpenDetail(r.id)}
                          className={`${tableStyles.actionBtn} ${tableStyles.editBtn}`}
                          title="Ver detalle"
                        >
                          <i className="bx bx-show"></i>
                        </button>
                        <button
                          onClick={() => { setSelectedRecon(r); setIsDeleteOpen(true); }}
                          className={`${tableStyles.actionBtn} ${tableStyles.deleteBtn}`}
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

          {/* Cards mobile */}
          <div className={tableStyles.cardList}>
            {paginated.map(r => (
              <div key={r.id} className={tableStyles.card}>
                <div className={tableStyles.cardTop}>
                  <div className={tableStyles.cardLeft}>
                    <div className={tableStyles.userInfo}>
                      <span className={tableStyles.userName}>{r.filename}</span>
                      <span className={tableStyles.userEmail}>{fmtDateTime(r.created_at)}</span>
                    </div>
                  </div>
                  <span className={tableStyles.monoCell}>{r.total_rows} filas</span>
                </div>

                <div className={tableStyles.cardMeta}>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>OK</span>
                    <span className={`${tabStyles.statusBadge} ${tabStyles.statusOk}`}>{r.ok_count}</span>
                  </div>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>Discrepancias</span>
                    <span className={`${tabStyles.statusBadge} ${tabStyles.statusDisc}`}>{r.discrepancy_count}</span>
                  </div>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>Solo Excel</span>
                    <span className={`${tabStyles.statusBadge} ${tabStyles.statusExcel}`}>{r.only_excel_count}</span>
                  </div>
                  <div className={tableStyles.metaItem}>
                    <span className={tableStyles.metaLabel}>Solo Sistema</span>
                    <span className={`${tabStyles.statusBadge} ${tabStyles.statusSistema}`}>{r.only_system_count}</span>
                  </div>
                </div>

                <div className={tableStyles.cardActions}>
                  <button
                    onClick={() => onOpenDetail(r.id)}
                    className={`${tableStyles.cardBtn} ${tableStyles.editBtn}`}
                  >
                    <i className="bx bx-show"></i> Ver detalle
                  </button>
                  <button
                    onClick={() => { setSelectedRecon(r); setIsDeleteOpen(true); }}
                    className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}
                  >
                    <i className="bx bx-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={reconciliations.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
            scrollRef={listRef as React.RefObject<HTMLElement>}
          />
        </>
      )}

      {/* Delete confirm */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedRecon(null); }}
        onConfirm={() => selectedRecon && deleteMutation.mutate(selectedRecon.id, {
          onSuccess: () => { setIsDeleteOpen(false); setSelectedRecon(null); },
        })}
        title="Eliminar conciliación"
        message={`¿Eliminar la conciliación "${selectedRecon?.filename}"? Se borrarán todos los resultados. Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
};