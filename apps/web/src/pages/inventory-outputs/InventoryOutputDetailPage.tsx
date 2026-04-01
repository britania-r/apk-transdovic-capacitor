// File: apps/web/src/pages/inventory-outputs/InventoryOutputDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import styles from './InventoryOutputDetailPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';

interface OutputDetail {
  id: string;
  output_code: string;
  output_date: string;
  notes: string | null;
  created_at: string;
  vehicle: { id: string; plate: string };
  responsible: { id: string; first_name: string };
  items: {
    id: number;
    product_id: string;
    product_name: string;
    product_code: string;
    quantity: number;
    current_stock: number;
  }[];
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

export const InventoryOutputDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<OutputDetail>({
    queryKey: ['inventory_output_detail', id],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('get_inventory_output_detail', { p_output_id: id } as any);
      if (error) throw error;
      return data as OutputDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-loader-alt bx-spin"></i>
        <span>Cargando detalle...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.stateBox}>
        <i className="bx bx-error-circle"></i>
        <span>Salida no encontrada</span>
      </div>
    );
  }

  const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/salidas" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver a salidas
          </Link>
        </div>

        <div className={styles.headerProfile}>
          <div className={styles.headerAvatar}>
            <i className="bx bx-export"></i>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{data.output_code}</h1>
            <span className={styles.headerSub}>Salida de inventario</span>
          </div>
        </div>

        <div className={styles.headerGrid}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Fecha / Hora</span>
            <span className={styles.headerValue}>{formatDateTime(data.output_date)}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Vehículo</span>
            <span className={styles.headerValue}>{data.vehicle?.plate || '—'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Responsable</span>
            <span className={styles.headerValue}>
              {data.responsible ? data.responsible.first_name : '—'}
            </span>
          </div>
          {data.notes && (
            <div className={styles.headerItem}>
              <span className={styles.headerLabel}>Notas</span>
              <span className={styles.headerValue}>{data.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <i className="bx bx-package"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Productos</span>
            <span className={styles.statValue}>{data.items.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="bx bx-hash"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Cantidad total</span>
            <span className={styles.statValue}>{totalQuantity}</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className={styles.itemsSection}>
        <h2 className={styles.itemsTitle}>
          Productos entregados
          <span className={styles.itemsCount}>{data.items.length}</span>
        </h2>

        {data.items.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bx bx-package"></i>
            <span>Sin productos</span>
          </div>
        ) : (
          <>
            <div className={tableStyles.tableWrapper}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th>Cantidad entregada</th>
                    <th>Stock actual</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(item => (
                    <tr key={item.id}>
                      <td><span className={tableStyles.userName}>{item.product_name}</span></td>
                      <td className={tableStyles.monoCell}>{item.product_code}</td>
                      <td className={styles.qtyCell}>{item.quantity}</td>
                      <td className={styles.stockCell}>{item.current_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={tableStyles.cardList}>
              {data.items.map(item => (
                <div key={item.id} className={tableStyles.card}>
                  <div className={tableStyles.cardTop}>
                    <div className={tableStyles.userInfo}>
                      <span className={tableStyles.userName}>{item.product_name}</span>
                      <span className={tableStyles.userEmail}>{item.product_code}</span>
                    </div>
                    <span className={styles.qtyBadge}>{item.quantity} uds</span>
                  </div>
                  <div className={tableStyles.cardMeta}>
                    <div className={tableStyles.metaItem}>
                      <span className={tableStyles.metaLabel}>Stock actual</span>
                      <span className={tableStyles.metaValue}>{item.current_stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};