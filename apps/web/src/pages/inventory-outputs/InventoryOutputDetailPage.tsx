// File: apps/web/src/pages/inventory-outputs/InventoryOutputDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import styles from './InventoryOutputDetailPage.module.css';
import tableStyles from '../../components/ui/Table.module.css';

interface OutputDetailItem {
  id: number;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  current_stock: number;
  unit_cost: number;
  total_cost: number;
  unit_name: string;
  is_fractional: boolean;
  sub_unit_name: string | null;
  units_per_package: number | null;
  vehicle_id: string | null;
  vehicle_plate: string | null;
}

interface OutputDetail {
  id: string;
  output_code: string;
  output_date: string;
  notes: string | null;
  created_at: string;
  responsible: { id: string; first_name: string };
  items: OutputDetailItem[];
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(amount);

const formatItemStock = (item: OutputDetailItem): string => {
  const stock = Number(item.current_stock);
  if (!item.is_fractional || !item.units_per_package || !item.sub_unit_name) {
    return `${stock} ${item.unit_name}`;
  }
  const full = Math.floor(stock / item.units_per_package);
  const rem = +(stock % item.units_per_package).toFixed(2);
  if (full === 0) return `${stock} ${item.sub_unit_name}`;
  if (rem === 0) return `${stock} ${item.sub_unit_name} (${full} ${item.unit_name})`;
  return `${stock} ${item.sub_unit_name} (${full} ${item.unit_name} + ${rem} ${item.sub_unit_name})`;
};

const formatItemQuantity = (item: OutputDetailItem): string => {
  const qty = Number(item.quantity);
  if (!item.is_fractional || !item.sub_unit_name) {
    return `${qty} ${item.unit_name}`;
  }
  return `${qty} ${item.sub_unit_name}`;
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

  const totalCost = data.items.reduce((sum, i) => sum + Number(i.total_cost), 0);
  const uniqueVehicles = [...new Set(data.items.map(i => i.vehicle_plate).filter(Boolean))];

  // Agrupar items por vehículo
  const itemsByVehicle = data.items.reduce<Record<string, { plate: string; items: OutputDetailItem[] }>>((acc, item) => {
    const key = item.vehicle_id || 'sin-vehiculo';
    if (!acc[key]) {
      acc[key] = { plate: item.vehicle_plate || 'Sin vehículo', items: [] };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

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
            <span className={styles.headerLabel}>Responsable</span>
            <span className={styles.headerValue}>
              {data.responsible ? data.responsible.first_name : '—'}
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Vehículos</span>
            <span className={styles.headerValue}>
              {uniqueVehicles.length > 0 ? uniqueVehicles.join(', ') : '—'}
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
            <i className="bx bxs-truck"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Vehículos</span>
            <span className={styles.statValue}>{uniqueVehicles.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <i className="bx bx-money"></i>
          </div>
          <div>
            <span className={styles.statLabel}>Costo total</span>
            <span className={styles.statValue}>{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Items agrupados por vehículo */}
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
          Object.entries(itemsByVehicle).map(([vehicleId, group]) => {
            const vehicleCost = group.items.reduce((sum, i) => sum + Number(i.total_cost), 0);
            return (
              <div key={vehicleId} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '8px', marginBottom: '12px', padding: '8px 12px',
                  background: 'var(--color-bg-secondary, #f8f9fa)', borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bx bxs-truck" style={{ color: 'var(--color-primary)', fontSize: '20px' }}></i>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{group.plate}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      ({group.items.length} {group.items.length === 1 ? 'producto' : 'productos'})
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-primary)' }}>
                    {formatCurrency(vehicleCost)}
                  </span>
                </div>

                {/* Tabla desktop */}
                <div className={tableStyles.tableWrapper}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Cantidad</th>
                        <th>Costo unit.</th>
                        <th>Costo total</th>
                        <th>Stock actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(item => (
                        <tr key={item.id}>
                          <td><span className={tableStyles.userName}>{item.product_name}</span></td>
                          <td className={tableStyles.monoCell}>{item.product_code}</td>
                          <td className={styles.qtyCell}>{formatItemQuantity(item)}</td>
                          <td className={styles.costCell}>{formatCurrency(Number(item.unit_cost))}</td>
                          <td className={styles.costCell}>{formatCurrency(Number(item.total_cost))}</td>
                          <td className={styles.stockCell}>{formatItemStock(item)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards mobile */}
                <div className={tableStyles.cardList}>
                  {group.items.map(item => (
                    <div key={item.id} className={tableStyles.card}>
                      <div className={tableStyles.cardTop}>
                        <div className={tableStyles.userInfo}>
                          <span className={tableStyles.userName}>{item.product_name}</span>
                          <span className={tableStyles.userEmail}>{item.product_code}</span>
                        </div>
                        <span className={styles.qtyBadge}>{formatItemQuantity(item)}</span>
                      </div>
                      <div className={tableStyles.cardMeta}>
                        <div className={tableStyles.metaItem}>
                          <span className={tableStyles.metaLabel}>Costo unitario</span>
                          <span className={tableStyles.metaValue}>{formatCurrency(Number(item.unit_cost))}</span>
                        </div>
                        <div className={tableStyles.metaItem}>
                          <span className={tableStyles.metaLabel}>Costo total</span>
                          <span className={tableStyles.metaValue}>{formatCurrency(Number(item.total_cost))}</span>
                        </div>
                        <div className={tableStyles.metaItem}>
                          <span className={tableStyles.metaLabel}>Stock actual</span>
                          <span className={tableStyles.metaValue}>{formatItemStock(item)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Total general */}
        {data.items.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', padding: '12px 16px',
            borderTop: '2px solid var(--color-border)', marginTop: '8px'
          }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>
              Total: {formatCurrency(totalCost)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};