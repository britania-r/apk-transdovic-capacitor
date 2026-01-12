import { useState } from 'react';
import { useAccountStatement } from '../../hooks/useAccountStatement';
import { AccountStatementTable } from './AccountStatementTable';
import { InitialBalanceModal } from './InitialBalanceModal';
import styles from '../users/UsersPage.module.css';

// --- ESTILOS ---
const filterBarStyle = {
  display: 'flex', gap: '1rem', flexWrap: 'wrap' as const,
  backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', alignItems: 'flex-end', marginBottom: '2rem'
};

const labelStyle = { 
  fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' 
};

const inputStyle = { 
  width: '100%', 
  padding: '0.7rem', 
  borderRadius: '8px', 
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  backgroundColor: '#fff',
  height: '42px'
};

export const AccountStatementPage = () => {
  const { 
    selectedAccountId, setSelectedAccountId,
    dateRange, setDateRange,
    accounts, transactions, isLoading,
    fileInputRef, handleImportExcel,
    handleExportExcel
  } = useAccountStatement();

  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);

  // Detectar cuenta seleccionada
  const selectedAccount = accounts?.find((a: any) => a.id === selectedAccountId);
  const currencySymbol = selectedAccount?.currency || 'PEN';

  // Solo mostrar importar si es BANCO
  const canImport = selectedAccount?.account_type === 'BANCO';

  // Filtros para Dropdown
  const cajas = accounts?.filter((a: any) => a.account_type === 'CAJA') || [];
  const bancos = accounts?.filter((a: any) => a.account_type === 'BANCO') || [];

  return (
    <div className={styles.pageContainer}>
      
      <header className={styles.pageHeader}>
        <h1>Estado de Cuenta Unificado</h1>
        
        {selectedAccountId && (
          <div style={{ display: 'flex', gap: '10px' }}>
              {/* SALDO INICIAL */}
              <button 
                className={styles.addButton}
                onClick={() => setBalanceModalOpen(true)}
                style={{ backgroundColor: '#4f46e5' }}
              >
                <i className='bx bx-coin-stack'></i> Saldo Inicial
              </button>

              {/* EXPORTAR */}
              <button 
                className={styles.addButton}
                onClick={handleExportExcel}
                style={{ backgroundColor: '#2563eb' }}
              >
                <i className='bx bxs-download'></i> Exportar
              </button>

              {/* IMPORTAR (SOLO BANCOS) */}
              {canImport && (
                <>
                    <input 
                        type="file" ref={fileInputRef} 
                        onChange={handleImportExcel} 
                        style={{ display: 'none' }} accept=".xlsx, .xls"
                    />
                    <button 
                        className={styles.addButton}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ backgroundColor: '#059669' }}
                    >
                        <i className='bx bxs-file-import'></i> Importar Excel
                    </button>
                </>
              )}
          </div>
        )}
      </header>

      <div style={filterBarStyle}>
        <div style={{ flex: '2 1 300px' }}>
          <label style={labelStyle}>Cuenta / Caja</label>
          <select 
            style={inputStyle}
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <option value="">-- Seleccionar Origen --</option>
            
            {cajas.length > 0 && (
              <optgroup label="Cajas Chicas">
                {cajas.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.currency}
                  </option>
                ))}
              </optgroup>
            )}

            {bancos.length > 0 && (
              <optgroup label="Cuentas Bancarias">
                {bancos.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.currency} - {acc.account_number}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
            <label style={labelStyle}>Desde</label>
            <input 
              type="date" 
              style={inputStyle} 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
        </div>
        <div style={{ flex: '1 1 150px' }}>
            <label style={labelStyle}>Hasta</label>
            <input 
              type="date" 
              style={inputStyle} 
              value={dateRange.end} 
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos...</div>
      ) : selectedAccountId && transactions ? (
        <AccountStatementTable 
            transactions={transactions} 
            currency={currencySymbol} 
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
          <i className='bx bxs-wallet' style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
          <p>Selecciona una Caja o Cuenta para gestionar sus movimientos.</p>
        </div>
      )}

      <InitialBalanceModal 
        isOpen={isBalanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        accountId={selectedAccountId}
      />
    </div>
  );
};