// File: apps/web/src/pages/settings/SettingsTable.tsx
import styles from '../../components/ui/Table.module.css';

export interface SettingsColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Props {
  items: any[];
  columns: SettingsColumn[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  getInitials?: (item: any) => string;
  getSubLabel?: (item: any) => string;
}

const defaultGetInitials = (item: any) =>
  (item.name || '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

export const SettingsTable = ({
  items,
  columns,
  onEdit,
  onDelete,
  getInitials = defaultGetInitials,
  getSubLabel,
}: Props) => {
  const mainCol = columns[0];
  const extraCols = columns.slice(1);

  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                {/* Primera columna con avatar */}
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {mainCol.render ? mainCol.render(item[mainCol.key], item) : item[mainCol.key]}
                      </span>
                      {getSubLabel && (
                        <span className={styles.userEmail}>{getSubLabel(item)}</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Columnas extra */}
                {extraCols.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}

                {/* Acciones */}
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(item)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar"
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      onClick={() => onDelete(item)}
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
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {mainCol.render ? mainCol.render(item[mainCol.key], item) : item[mainCol.key]}
                  </span>
                  {getSubLabel && (
                    <span className={styles.userEmail}>{getSubLabel(item)}</span>
                  )}
                </div>
              </div>
            </div>

            {extraCols.length > 0 && (
              <div className={styles.cardMeta}>
                {extraCols.map(col => (
                  <div key={col.key} className={styles.metaItem}>
                    <span className={styles.metaLabel}>{col.label}</span>
                    <span className={styles.metaValue}>
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.cardActions}>
              <button
                onClick={() => onEdit(item)}
                className={`${styles.cardBtn} ${styles.editBtn}`}
              >
                <i className="bx bx-pencil"></i> Editar
              </button>
              <button
                onClick={() => onDelete(item)}
                className={`${styles.cardBtn} ${styles.deleteBtn}`}
              >
                <i className="bx bx-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};