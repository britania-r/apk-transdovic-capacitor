// File: apps/web/src/pages/settings/SettingsCRUDPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { SettingsTable, type SettingsColumn } from './SettingsTable';
import { SettingsFormModal, type FieldConfig } from './SettingsFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import styles from '../users/UsersPage.module.css';

interface SettingsCRUDConfig {
  /** Nombre de la tabla en Supabase */
  tableName: string;
  /** Query key para react-query */
  queryKey: string;
  /** Título de la página (ej: "Categoría") */
  title: string;
  /** Título plural (ej: "Categorías") */
  titlePlural: string;
  /** Ícono para el modal y estado vacío */
  icon: string;
  /** Columnas de la tabla */
  columns: SettingsColumn[];
  /** Campos del formulario */
  fields: FieldConfig[];
  /** Placeholder del buscador */
  searchPlaceholder?: string;
  /** Campos por los que se puede buscar */
  searchFields?: string[];
  /** Función custom para fetch (para joins) */
  fetchFn?: () => Promise<any[]>;
  /** Sublabel en la celda principal */
  getSubLabel?: (item: any) => string;
  /** Select fields para el query */
  selectFields?: string;
  /** Order by field */
  orderBy?: string;
}

interface Props {
  config: SettingsCRUDConfig;
}

export const SettingsCRUDPage = ({ config }: Props) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  const defaultFetch = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(config.tableName)
      .select(config.selectFields || 'id, name')
      .order(config.orderBy || 'name');
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: items = [], isLoading, error } = useQuery<any[], Error>({
    queryKey: [config.queryKey],
    queryFn: config.fetchFn || defaultFetch,
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    const fields = config.searchFields || ['name'];
    return items.filter(item =>
      fields.some(f => item[f] && String(item[f]).toLowerCase().includes(q))
    );
  }, [items, search, config.searchFields]);

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...formData } = data;
      const supabase = getSupabase();
      const query = id
        ? supabase.from(config.tableName).update(formData).eq('id', id)
        : supabase.from(config.tableName).insert([formData]);
      const { error } = await query;
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, variables) => {
      toast.success(variables.id ? `${config.title} actualizado` : `${config.title} creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from(config.tableName).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`${config.title} eliminado`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      handleCloseModals();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleCloseModals = () => {
    setSelectedItem(null);
    setFormOpen(false);
    setConfirmOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>{config.titlePlural}</h1>
            <span className={styles.count}>{items.length}</span>
          </div>

          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder={config.searchPlaceholder || `Buscar ${config.titlePlural.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => { setSelectedItem(null); setFormOpen(true); }}
            className={styles.addBtn}
          >
            <i className="bx bx-plus"></i>
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando {config.titlePlural.toLowerCase()}...</span>
        </div>
      )}

      {error && (
        <div className={styles.stateBox}>
          <i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i>
          <span>Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && filteredItems.length === 0 && (
        <div className={styles.stateBox}>
          <i className={config.icon}></i>
          <span>{search ? 'Sin resultados para tu búsqueda' : `No hay ${config.titlePlural.toLowerCase()} registrados`}</span>
        </div>
      )}

      {!isLoading && filteredItems.length > 0 && (
        <SettingsTable
          items={filteredItems}
          columns={config.columns}
          onEdit={item => { setSelectedItem(item); setFormOpen(true); }}
          onDelete={item => { setSelectedItem(item); setConfirmOpen(true); }}
          getSubLabel={config.getSubLabel}
        />
      )}

      <SettingsFormModal
        isOpen={isFormOpen}
        onClose={handleCloseModals}
        onSubmit={data => upsertMutation.mutate(data)}
        itemToEdit={selectedItem}
        isLoading={upsertMutation.isPending}
        title={config.title}
        icon={config.icon}
        fields={config.fields}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
        title={`Eliminar ${config.title.toLowerCase()}`}
        message={`¿Estás seguro de eliminar "${selectedItem?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};