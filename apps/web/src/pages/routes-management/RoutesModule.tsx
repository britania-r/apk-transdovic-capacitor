// File: apps/web/src/pages/routes-management/RoutesModule.tsx
import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

import { RoutesContent } from './RoutesContent';
import { GuidesContent } from './GuidesContent';
import { PhotosContent } from './PhotosContent';
import { ImportRoutesModal } from './ImportRoutesModal';

import styles from '../users/UsersPage.module.css';
import localStyles from '../operations/OperationsPage.module.css';
import tabStyles from '../fuel-vouchers/ValesTabs.module.css';

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

type Tab = 'rutas' | 'guias' | 'imagenes';

const RoutesModuleContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>('rutas');

  // ── Filtros compartidos ──
  const [dateFilter, setDateFilter] = useState(getToday());
  const [search, setSearch] = useState('');

  // ── Contadores por tab ──
  const [countRutas, setCountRutas] = useState(0);
  const [countGuias, setCountGuias] = useState(0);
  const [countFotos, setCountFotos] = useState(0);

  // ── Modal importar (solo tab rutas) ──
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const activeCount =
    activeTab === 'rutas' ? countRutas
    : activeTab === 'guias' ? countGuias
    : countFotos;

  const searchPlaceholder =
    activeTab === 'rutas'
      ? 'Buscar por conductor, placa, SAP o estado...'
      : activeTab === 'guias'
        ? 'Buscar por conductor, placa, SAP, nro guía...'
        : 'Buscar por ruta, conductor, placa, granja...';

  const tabTitle =
    activeTab === 'rutas' ? 'Rutas'
    : activeTab === 'guias' ? 'Guías'
    : 'Imágenes';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          {/* ── Tabs ── */}
          <div className={tabStyles.tabs}>
            <button
              className={`${tabStyles.tab} ${activeTab === 'rutas' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('rutas')}
            >
              <i className="bx bxs-map-alt"></i>
              <span>Rutas</span>
            </button>
            <button
              className={`${tabStyles.tab} ${activeTab === 'guias' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('guias')}
            >
              <i className="bx bx-file"></i>
              <span>Guías</span>
            </button>
            <button
              className={`${tabStyles.tab} ${activeTab === 'imagenes' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('imagenes')}
            >
              <i className="bx bx-camera"></i>
              <span>Imágenes</span>
            </button>
          </div>

          {/* ── Título + count ── */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>{tabTitle}</h1>
            <span className={styles.count}>{activeCount}</span>
          </div>

          {/* ── Buscador ── */}
          <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder={searchPlaceholder}
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

          {/* ── Filtro fecha ── */}
          <div className={localStyles.dateFilter}>
            <i className="bx bx-calendar"></i>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className={localStyles.dateInput}
              title="Fecha"
            />
          </div>

          {/* ── Limpiar fecha ── */}
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className={localStyles.clearBtn}
              title="Ver todas las fechas"
            >
              <i className="bx bx-filter-alt"></i>
              <i className="bx bx-x"></i>
            </button>
          )}

          {/* ── Acciones por tab ── */}
          {activeTab === 'rutas' && (
            <button onClick={() => setImportModalOpen(true)} className={styles.addBtn}>
              <i className="bx bxs-file-import"></i>
              <span>Importar Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════ CONTENIDO POR TAB ══════════ */}
      {activeTab === 'rutas' && (
        <RoutesContent
          dateFilter={dateFilter}
          search={search}
          onCountChange={setCountRutas}
        />
      )}

      {activeTab === 'guias' && (
        <GuidesContent
          dateFilter={dateFilter}
          search={search}
          onCountChange={setCountGuias}
        />
      )}

      {activeTab === 'imagenes' && (
        <PhotosContent
          dateFilter={dateFilter}
          search={search}
          onCountChange={setCountFotos}
        />
      )}

      {/* ── Modal importar ── */}
      <ImportRoutesModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
};

export const RoutesModule = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <RoutesModuleContent />
  </APIProvider>
);