import { useState } from 'react';
import { useAccountStatement } from '../../hooks/useAccountStatement';
import type { LedgerRow } from '../../hooks/useAccountStatement';
import { AccountStatementTable } from './AccountStatementTable';
import { InitialBalanceModal } from './InitialBalanceModal';
import { ExchangeRatePanel } from './ExchangeRatePanel';
import { ExchangeRateOverrideModal } from './ExchangeRateOverrideModal';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import styles from './AccountStatementPage.module.css';
import pageStyles from '../users/UsersPage.module.css';

export const AccountStatementPage = () => {
  const {
    selectedAccountId, setSelectedAccountId,
    dateRange, setDateRange,
    accounts, transactions, isLoading,
    fileInputRef, handleImportExcel, handleExportExcel,
    // Tipo de cambio
    isUSD, uniqueDates, ratesMap,
    saveExchangeRate, saveExchangeRatesBatch, saveTransactionOverride,
  } = useAccountStatement();

  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);

  // Override modal state
  const [overrideTarget, setOverrideTarget] = useState<LedgerRow | null>(null);
  const isOverrideOpen = overrideTarget !== null;

  const selectedAccount = accounts?.find((a: any) => a.id === selectedAccountId);
  const currencySymbol = selectedAccount?.currency || 'PEN';
  const canImport = selectedAccount?.account_type === 'BANCO';

  // Opciones agrupadas
  const cajas = accounts?.filter((a: any) => a.account_type === 'CAJA') || [];
  const bancos = accounts?.filter((a: any) => a.account_type === 'BANCO') || [];

  const accountOptions = [
    ...cajas.map((a: any) => ({
      value: a.id,
      label: `${a.bank_name} — ${a.currency}`,
      group: 'Cajas Chicas',
    })),
    ...bancos.map((a: any) => ({
      value: a.id,
      label: `${a.bank_name} — ${a.currency} — ${a.account_number}`,
      group: 'Cuentas Bancarias',
    })),
  ];

  return (
    <div className={pageStyles.page}>

      {/* ── Header ── */}
      <div className={pageStyles.pageHeader}>
        <div className={pageStyles.headerTop}>
          <div className={pageStyles.headerTitle}>
            <h1 className={pageStyles.title}>Estado de Cuenta</h1>
          </div>

          {selectedAccountId && (
            <div className={styles.headerActions}>
              <button
                className={styles.actionButton}
                onClick={() => setBalanceModalOpen(true)}
                data-variant="primary"
              >
                <i className="bx bx-coin-stack"></i>
                <span>Saldo Inicial</span>
              </button>

              <button
                className={styles.actionButton}
                onClick={handleExportExcel}
                data-variant="info"
              >
                <i className="bx bxs-download"></i>
                <span>Exportar</span>
              </button>

              {canImport && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportExcel}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                  />
                  <button
                    className={styles.actionButton}
                    onClick={() => fileInputRef.current?.click()}
                    data-variant="success"
                  >
                    <i className="bx bxs-file-import"></i>
                    <span>Importar Excel</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterAccount}>
          <SimpleSelect
            label="Cuenta / Caja"
            options={accountOptions}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            placeholder="Seleccionar origen..."
          />
        </div>

        <div className={styles.filterDate}>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>Desde</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>Hasta</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* ── Panel de Tipo de Cambio (solo USD) ── */}
      {isUSD && selectedAccountId && transactions && transactions.length > 0 && (
        <ExchangeRatePanel
          uniqueDates={uniqueDates}
          ratesMap={ratesMap}
          onSaveBatch={saveExchangeRatesBatch}
          onSaveSingle={saveExchangeRate}
        />
      )}

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-loader-alt bx-spin"></i>
          <span>Cargando movimientos...</span>
        </div>
      ) : selectedAccountId && transactions ? (
        <AccountStatementTable
          transactions={transactions}
          currency={currencySymbol}
          isUSD={isUSD}
          ratesMap={ratesMap}
          onOpenOverride={setOverrideTarget}
        />
      ) : (
        <div className={pageStyles.stateBox}>
          <i className="bx bx-wallet"></i>
          <span>Selecciona una caja o cuenta para gestionar sus movimientos</span>
        </div>
      )}

      {/* ── Modales ── */}
      <InitialBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        accountId={selectedAccountId}
      />

      <ExchangeRateOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setOverrideTarget(null)}
        transaction={overrideTarget}
        dayRate={overrideTarget ? (ratesMap.get(overrideTarget.transaction_date) ?? null) : null}
        onSave={saveTransactionOverride}
      />
    </div>
  );
};