// File: apps/web/src/pages/operations/OperationsPage.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import { useOperations, type Operation } from './hooks/useOperations';
import { OperationsTable } from './OperationsTable';
import { OperationFormModal } from './OperationFormModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { CompanyAccount } from '../company-accounts/CompanyAccountsPage';
import styles from '../users/UsersPage.module.css';
import localStyles from './OperationsPage.module.css';

const fetchAccounts = async () => {
  const { data } = await getSupabase().rpc('get_company_accounts_with_bank');
  return (data || []) as CompanyAccount[];
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'GASTO', label: 'Gasto' },
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'RETIRO', label: 'Retiro' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export const OperationsPage = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { operations = [], isLoading: loadingOps, saveMutation, deleteMutation } = useOperations();

  const { data: accounts = [], isLoading: loadingAccs } = useQuery<CompanyAccount[], Error>({
    queryKey: ['company_accounts'],
    queryFn: fetchAccounts,
  });

  const isLoading = loadingOps || loadingAccs;

  const filteredOperations = useMemo(() => {
    let result = operations;

    if (dateFrom) {
      result = result.filter((op: Operation) => op.operation_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((op: Operation) => op.operation_date <= dateTo);
    }
    if (typeFilter) {
      result = result.filter((op: Operation) => op.operation_type === typeFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((op: Operation) =>
        op.operation_type.toLowerCase().includes(q) ||
        (op.description && op.description.toLowerCase().includes(q)) ||
        (op.detail && op.detail.toLowerCase().includes(q)) ||
        (op.account_name && op.account_name.toLowerCase().includes(q)) ||
        (op.movement_number && op.movement_number.includes(q)) ||
        (op.document_number && op.document_number.includes(q))
      );
    }

    return result;
  }, [operations, search, dateFrom, dateTo, typeFilter]);

  const handleCloseModals = () => {
    setSelectedOp(null);
    setIsFormOpen(false);
    setIsDeleteOpen(false);
  };

  const handleFormSubmit = (cleanData: any) => {
    saveMutation.mutate(cleanData, {
      onSuccess: (responseId) => {
        setIsFormOpen(false);
        if (cleanData.p_is_multiple && !cleanData.p_id) {
          if (responseId) navigate(`/operaciones/${responseId}`);
        }
      },
    });
  };

  const hasActiveFilters = !!dateFrom || !!dateTo || !!typeFilter || !!search;

  const clearAllFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('');
    setSearch('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          {/* Título + contador */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Operaciones</h1>
            <span className={styles.count}>{filteredOperations.length}</span>
          </div>

          {/* Buscador */}
          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Buscar..."
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

          {/* Filtro fecha desde */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={localStyles.dateInput}
              title="Desde"
            />
          </div>

          {/* Filtro fecha hasta */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar-check"></i>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={localStyles.dateInput}
              title="Hasta"
            />
          </div>

          {/* Filtro tipo */}
          <div className={localStyles.typeFilter}>
            <SimpleSelect
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Tipo"
            />
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={localStyles.clearBtn}
              title="Limpiar filtros"
            >
              <i className="bx bx-filter-alt"></i>
              <i className="bx bx-x"></i>
            </button>
          )}

          {/* Botón nuevo */}
          <button
            onClick={() => { setSelectedOp(null); setIsFormOpen(true); }}
            className={styles.addBtn}
            disabled={isLoading}
          >
            <i className="bx bx-plus"></i>
            <span>Nueva operación</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className={styles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando operaciones...</span>
        </div>
      )}

      {!isLoading && filteredOperations.length === 0 && (
        <div className={styles.stateBox}>
          <i className="bx bx-receipt"></i>
          <span>{hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay operaciones registradas'}</span>
        </div>
      )}

      {!isLoading && filteredOperations.length > 0 && (
        <OperationsTable
          operations={filteredOperations}
          onEdit={op => { setSelectedOp(op); setIsFormOpen(true); }}
          onDelete={op => { setSelectedOp(op); setIsDeleteOpen(true); }}
        />
      )}

      {accounts.length > 0 && isFormOpen && (
        <OperationFormModal
          isOpen={isFormOpen}
          onClose={handleCloseModals}
          onSuccess={handleFormSubmit}
          isLoading={saveMutation.isPending}
          opToEdit={selectedOp}
          accounts={accounts}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={handleCloseModals}
        onConfirm={() => selectedOp && deleteMutation.mutate(selectedOp.id, { onSuccess: () => setIsDeleteOpen(false) })}
        title="Eliminar operación"
        message="¿Estás seguro de eliminar esta operación? Si es una caja chica, el saldo se revertirá. Esta acción es irreversible."
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};