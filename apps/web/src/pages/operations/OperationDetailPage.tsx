// File: apps/web/src/pages/operations/OperationDetailPage.tsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { OperationDetailFormModal } from './OperationDetailFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from './OperationDetailPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';

interface DetailItem {
  id: string;
  document_number: string;
  amount: number;
  voucher_url?: string;
}

interface OperationData {
  id: string;
  operation_type: string;
  operation_date: string;
  amount: number;
  currency: string;
  detail?: string;
  operation_number?: string;
  account?: {
    id: string;
    bank_name: string;
    currency: string;
    account_number: string;
  };
  operation_details?: DetailItem[];
}

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

export const OperationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<DetailItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<OperationData>({
    queryKey: ['operation', id],
    queryFn: async () => {
      const supabase = getSupabase();

      const { data: opData, error: opError } = await supabase
        .from('operations')
        .select('*')
        .eq('id', id)
        .single();
      if (opError) throw opError;

      let accountInfo = null;
      if (opData.account_id) {
        const { data: accData, error: accError } = await supabase
          .from('company_bank_accounts')
          .select('*')
          .eq('id', opData.account_id)
          .single();

        if (!accError && accData) {
          let bankName = 'Banco desconocido';
          if (accData.bank_id) {
            const { data: bankData } = await supabase
              .from('banks')
              .select('name')
              .eq('id', accData.bank_id)
              .single();
            if (bankData) bankName = bankData.name;
          }
          accountInfo = {
            id: accData.id,
            bank_name: bankName,
            currency: accData.currency,
            account_number: accData.account_number,
          };
        }
      }

      const { data: detailsData, error: detError } = await supabase
        .from('operation_details')
        .select('*')
        .eq('operation_id', id);
      if (detError) throw detError;

      return {
        ...opData,
        account: accountInfo,
        operation_details: detailsData || [],
      } as OperationData;
    },
    enabled: !!id,
  });

  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: string) => {
      const { error } = await getSupabase().rpc('delete_operation_detail', { p_detail_id: detailId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Detalle eliminado');
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      setDetailToDelete(null);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando detalles...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>Operación no encontrada</span>
      </div>
    );
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: data.currency }).format(amount);

  const details = data.operation_details || [];

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/operaciones" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver a operaciones
          </Link>
          <button
            onClick={() => navigate('/operaciones')}
            className={styles.finishBtn}
          >
            <i className="bx bx-check"></i>
            Finalizar carga
          </button>
        </div>

        <div className={styles.headerProfile}>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>Detalle de Operación</h1>
            <span className={styles.headerSub}>
              {data.operation_number ? `Voucher: ${data.operation_number}` : 'Sin voucher global'}
            </span>
          </div>
        </div>

        {/* Grid de datos rápidos */}
        <div className={styles.headerGrid}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Tipo</span>
            <span className={styles.headerValue}>{data.operation_type}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Fecha</span>
            <span className={styles.headerValue}>{formatDate(data.operation_date)}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Cuenta</span>
            <span className={styles.headerValue}>
              {data.account ? `${data.account.bank_name} — ${data.account.account_number}` : '—'}
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Monto total</span>
            <span className={`${styles.headerValue} ${styles.amountHighlight}`}>
              {formatMoney(data.amount)}
            </span>
          </div>
        </div>

        {data.detail && (
          <div className={styles.detailNote}>
            <span className={styles.headerLabel}>Detalle global</span>
            <span className={styles.detailText}>{data.detail}</span>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <i className="bx bx-file"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Items</span>
            <span className={styles.statValue}>{details.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="bx bx-money"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Total items</span>
            <span className={styles.statValue}>
              {formatMoney(details.reduce((sum, d) => sum + d.amount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* ── Items / Facturas ── */}
      <div className={styles.itemsSection}>
        <div className={styles.itemsHeader}>
          <h2 className={styles.itemsTitle}>
            Items / Facturas
            <span className={styles.itemsCount}>{details.length}</span>
          </h2>
          <button onClick={() => setIsModalOpen(true)} className={styles.itemsAddBtn}>
            <i className="bx bx-plus"></i>
            Agregar item
          </button>
        </div>

        {details.length === 0 ? (
          <div className={styles.itemsEmpty}>
            <i className="bx bx-file"></i>
            <span>No hay facturas cargadas</span>
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className={tableStyles.tableWrapper}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>N° Documento</th>
                    <th>Monto</th>
                    <th>Archivo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map(d => (
                    <tr key={d.id}>
                      <td className={tableStyles.monoCell}>{d.document_number || '—'}</td>
                      <td className={styles.amountCell}>{formatMoney(d.amount)}</td>
                      <td>
                        {d.voucher_url ? (
                          <a
                            href={d.voucher_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileLink}
                          >
                            <i className="bx bx-file"></i> Ver PDF
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        <div className={tableStyles.actions}>
                          <button
                            onClick={() => setDetailToDelete(d)}
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
              {details.map(d => (
                <div key={d.id} className={tableStyles.card}>
                  <div className={tableStyles.cardTop}>
                    <div className={tableStyles.cardLeft}>
                      <div className={tableStyles.userInfo}>
                        <span className={tableStyles.userName}>{d.document_number || '—'}</span>
                        <span className={tableStyles.userEmail}>{formatMoney(d.amount)}</span>
                      </div>
                    </div>
                    {d.voucher_url && (
                      <a
                        href={d.voucher_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileLink}
                      >
                        <i className="bx bx-file"></i>
                      </a>
                    )}
                  </div>
                  <div className={tableStyles.cardActions}>
                    <button
                      onClick={() => setDetailToDelete(d)}
                      className={`${tableStyles.cardBtn} ${tableStyles.deleteBtn}`}
                    >
                      <i className="bx bx-trash"></i> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {id && (
        <OperationDetailFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          operationId={id}
        />
      )}

      <ConfirmationModal
        isOpen={!!detailToDelete}
        onClose={() => setDetailToDelete(null)}
        onConfirm={() => detailToDelete && deleteDetailMutation.mutate(detailToDelete.id)}
        title="Eliminar item"
        message={`¿Estás seguro de eliminar el documento "${detailToDelete?.document_number || 'sin número'}"?`}
        confirmText="Sí, eliminar"
        isLoading={deleteDetailMutation.isPending}
        variant="danger"
      />
    </div>
  );
};