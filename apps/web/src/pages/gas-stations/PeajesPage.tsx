// File: apps/web/src/pages/gas-stations/PeajesPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';

import { PeajeTable } from './PeajeTable';
import { PeajeFormModal } from './PeajeFormModal';
import { TollUploadModal } from './TollUploadModal';
import { TollDeleteModal } from './TollDeleteModal';
import type { TollDeletePayload } from './TollDeleteModal';
import { TollRecordsContent } from './TollRecordsTab';
import { TollReconciliationContent } from './TollReconciliationTab';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import {
  useTollRecords,
  useTollReconciliation,
  parseCovisolExcel,
  parseComsatelExcel,
} from './hooks/useTollRecords';

import { SimpleSelect } from '../../components/ui/SimpleSelect';
import styles from '../users/UsersPage.module.css';
import localStyles from '../operations/OperationsPage.module.css';
import tabStyles from '../fuel-vouchers/ValesTabs.module.css';

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas las fuentes' },
  { value: 'covisol', label: 'COVISOL' },
  { value: 'comsatel', label: 'COMSATEL' },
];

// --- Tipo exportado ---
export interface Peaje {
  id: string;
  name: string;
  billing_frequency: number;
  notes: string | null;
  tag_covisol: string | null;
  tag_comsatel: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string | null;
}

// --- API Peajes ---
const fetchPeajes = async (): Promise<Peaje[]> => {
  const { data, error } = await getSupabase()
    .from('gas_stations').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createPeaje = async (d: Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await getSupabase().from('gas_stations').insert(d);
  if (error) throw new Error(error.message);
};

const updatePeaje = async (d: Peaje) => {
  const { id, created_at, updated_at, ...rest } = d;
  const { error } = await getSupabase().from('gas_stations').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
};

const deletePeaje = async (id: string) => {
  const { error } = await getSupabase().from('gas_stations').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

type Tab = 'peajes' | 'registros' | 'conciliacion';

export const PeajesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('peajes');
  const qc = useQueryClient();

  // ── Peajes CRUD state ──
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedPeaje, setSelectedPeaje] = useState<Peaje | null>(null);
  const [searchPeajes, setSearchPeajes] = useState('');

  const { data: peajes = [], isLoading: loadingPeajes, error: errorPeajes } = useQuery<Peaje[], Error>({
    queryKey: ['peajes'],
    queryFn: fetchPeajes,
  });

  const filteredPeajes = useMemo(() => {
    const q = searchPeajes.toLowerCase().trim();
    if (!q) return peajes;
    return peajes.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.tag_covisol && p.tag_covisol.toLowerCase().includes(q)) ||
      (p.tag_comsatel && p.tag_comsatel.toLowerCase().includes(q))
    );
  }, [peajes, searchPeajes]);

  const onMutationOk = (msg: string) => { toast.success(msg); qc.invalidateQueries({ queryKey: ['peajes'] }); closeModals(); };
  const onMutationErr = (e: Error) => toast.error(`Error: ${e.message}`);

  const createMut = useMutation({ mutationFn: createPeaje, onSuccess: () => onMutationOk('Peaje creado'), onError: onMutationErr });
  const updateMut = useMutation({ mutationFn: updatePeaje, onSuccess: () => onMutationOk('Peaje actualizado'), onError: onMutationErr });
  const deleteMut = useMutation({ mutationFn: deletePeaje, onSuccess: () => onMutationOk('Peaje eliminado'), onError: onMutationErr });

  const closeModals = () => { setSelectedPeaje(null); setFormOpen(false); setDeleteOpen(false); setUploadOpen(false); setDeleteRecordsOpen(false); };

  const handleFormSubmit = (d: Peaje | Omit<Peaje, 'id' | 'created_at' | 'updated_at'>) => {
    if ('id' in d) updateMut.mutate(d); else createMut.mutate(d);
  };

  // ── Registros state ──
  const [dateFromRec, setDateFromRec] = useState('');
  const [dateToRec, setDateToRec] = useState('');
  const [plateRec, setPlateRec] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeleteRecordsOpen, setDeleteRecordsOpen] = useState(false);

  const { records, isLoading: loadingRecords, insertMutation, deleteByRangeMutation } = useTollRecords(
    dateFromRec || undefined, dateToRec || undefined,
    plateRec || undefined, sourceFilter || undefined
  );

  const hasRecFilters = !!dateFromRec || !!dateToRec || !!plateRec || !!sourceFilter;
  const clearRecFilters = () => { setDateFromRec(''); setDateToRec(''); setPlateRec(''); setSourceFilter(''); };

  const handleUpload = async (file: File, source: 'covisol' | 'comsatel') => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = source === 'covisol'
        ? parseCovisolExcel(buffer, peajes, file.name)
        : parseComsatelExcel(buffer, peajes, file.name);
      if (parsed.length === 0) { alert('El archivo no contiene filas válidas'); return; }
      insertMutation.mutate(parsed, { onSuccess: () => setUploadOpen(false) });
    } catch (err: any) {
      alert(`Error al procesar: ${err.message}`);
    }
  };

  const handleDeleteRecords = (payload: TollDeletePayload) => {
    deleteByRangeMutation.mutate(payload, {
      onSuccess: () => setDeleteRecordsOpen(false),
    });
  };

  // ── Conciliación state ──
  const [dateFromConc, setDateFromConc] = useState('');
  const [dateToConc, setDateToConc] = useState('');
  const [plateConc, setPlateConc] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { rows: concRows, isLoading: loadingConc } = useTollReconciliation(
    dateFromConc || undefined, dateToConc || undefined, plateConc || undefined
  );

  const hasConcFilters = !!dateFromConc || !!dateToConc || !!plateConc || !!statusFilter;
  const clearConcFilters = () => { setDateFromConc(''); setDateToConc(''); setPlateConc(''); setStatusFilter(''); };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={localStyles.headerRow}>
          {/* ── Tabs ── */}
          <div className={tabStyles.tabs}>
            <button
              className={`${tabStyles.tab} ${activeTab === 'peajes' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('peajes')}
            >
              <i className="bx bx-map-pin"></i>
              <span>Peajes</span>
            </button>
            <button
              className={`${tabStyles.tab} ${activeTab === 'registros' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('registros')}
            >
              <i className="bx bx-upload"></i>
              <span>Registros</span>
            </button>
            <button
              className={`${tabStyles.tab} ${activeTab === 'conciliacion' ? tabStyles.tabActive : ''}`}
              onClick={() => setActiveTab('conciliacion')}
            >
              <i className="bx bx-check-double"></i>
              <span>Conciliación</span>
            </button>
          </div>

          {/* ── Título + count ── */}
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>
              {activeTab === 'peajes' ? 'Peajes' : activeTab === 'registros' ? 'Registros' : 'Conciliación'}
            </h1>
            <span className={styles.count}>
              {activeTab === 'peajes' ? filteredPeajes.length
                : activeTab === 'registros' ? records.length
                : concRows.length}
            </span>
          </div>

          {/* ══ Controles tab PEAJES ══ */}
          {activeTab === 'peajes' && (
            <>
              <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Buscar por nombre, notas o tags..."
                  value={searchPeajes}
                  onChange={e => setSearchPeajes(e.target.value)}
                  className={styles.searchInput}
                />
                {searchPeajes && (
                  <button className={styles.searchClear} onClick={() => setSearchPeajes('')}>
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSelectedPeaje(null); setFormOpen(true); }}
                className={styles.addBtn}
              >
                <i className="bx bx-plus"></i>
                <span>Nuevo peaje</span>
              </button>
            </>
          )}

          {/* ══ Controles tab REGISTROS ══ */}
          {activeTab === 'registros' && (
            <>
              <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Buscar por placa..."
                  value={plateRec}
                  onChange={e => setPlateRec(e.target.value)}
                  className={styles.searchInput}
                />
                {plateRec && (
                  <button className={styles.searchClear} onClick={() => setPlateRec('')}>
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>

              <div className={localStyles.dateFilter}>
                <i className="bx bx-calendar"></i>
                <input type="date" value={dateFromRec} onChange={e => setDateFromRec(e.target.value)} className={localStyles.dateInput} title="Desde" />
              </div>
              <div className={localStyles.dateFilter}>
                <i className="bx bx-calendar-check"></i>
                <input type="date" value={dateToRec} onChange={e => setDateToRec(e.target.value)} className={localStyles.dateInput} title="Hasta" />
              </div>

              <div className={localStyles.typeFilter}>
                <SimpleSelect
                  options={SOURCE_OPTIONS}
                  value={sourceFilter}
                  onChange={setSourceFilter}
                  placeholder="Todas las fuentes"
                />
              </div>

              {hasRecFilters && (
                <button onClick={clearRecFilters} className={localStyles.clearBtn} title="Limpiar filtros">
                  <i className="bx bx-filter-alt"></i>
                  <i className="bx bx-x"></i>
                </button>
              )}

              <button
                onClick={() => setDeleteRecordsOpen(true)}
                title="Limpiar registros"
                style={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid var(--color-danger-border, rgba(239,68,68,0.3))',
                  borderRadius: 'var(--radius)', background: 'transparent', cursor: 'pointer',
                  color: 'var(--color-danger)', flexShrink: 0, fontSize: '1.15rem',
                }}
              >
                <i className="bx bx-trash"></i>
              </button>

              <button onClick={() => setUploadOpen(true)} className={styles.addBtn}>
                <i className="bx bx-upload"></i>
                <span>Subir Excel</span>
              </button>
            </>
          )}

          {/* ══ Controles tab CONCILIACIÓN ══ */}
          {activeTab === 'conciliacion' && (
            <>
              <div className={`${styles.searchBar} ${localStyles.searchBar}`}>
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Buscar por placa..."
                  value={plateConc}
                  onChange={e => setPlateConc(e.target.value)}
                  className={styles.searchInput}
                />
                {plateConc && (
                  <button className={styles.searchClear} onClick={() => setPlateConc('')}>
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>

              <div className={localStyles.dateFilter}>
                <i className="bx bx-calendar"></i>
                <input type="date" value={dateFromConc} onChange={e => setDateFromConc(e.target.value)} className={localStyles.dateInput} title="Desde" />
              </div>
              <div className={localStyles.dateFilter}>
                <i className="bx bx-calendar-check"></i>
                <input type="date" value={dateToConc} onChange={e => setDateToConc(e.target.value)} className={localStyles.dateInput} title="Hasta" />
              </div>

              {hasConcFilters && (
                <button onClick={clearConcFilters} className={localStyles.clearBtn} title="Limpiar filtros">
                  <i className="bx bx-filter-alt"></i>
                  <i className="bx bx-x"></i>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════ TAB: PEAJES ══════════ */}
      {activeTab === 'peajes' && (
        <>
          {loadingPeajes && (
            <div className={styles.stateBox}><i className="bx bx-loader-alt bx-spin"></i><span>Cargando peajes...</span></div>
          )}
          {errorPeajes && (
            <div className={styles.stateBox}><i className="bx bx-error-circle" style={{ color: 'var(--color-danger)' }}></i><span>Error: {errorPeajes.message}</span></div>
          )}
          {!loadingPeajes && !errorPeajes && filteredPeajes.length === 0 && (
            <div className={styles.stateBox}><i className="bx bx-map-pin"></i><span>{searchPeajes ? 'Sin resultados' : 'No hay peajes registrados'}</span></div>
          )}
          {!loadingPeajes && filteredPeajes.length > 0 && (
            <PeajeTable
              peajes={filteredPeajes}
              onEdit={p => { setSelectedPeaje(p); setFormOpen(true); }}
              onDelete={p => { setSelectedPeaje(p); setDeleteOpen(true); }}
            />
          )}
        </>
      )}

      {/* ══════════ TAB: REGISTROS ══════════ */}
      {activeTab === 'registros' && (
        <TollRecordsContent
          records={records}
          isLoading={loadingRecords}
          hasFilters={hasRecFilters}
        />
      )}

      {/* ══════════ TAB: CONCILIACIÓN ══════════ */}
      {activeTab === 'conciliacion' && (
        <TollReconciliationContent
          rows={concRows}
          isLoading={loadingConc}
          hasFilters={hasConcFilters}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {/* ── Modales ── */}
      <PeajeFormModal
        isOpen={isFormOpen}
        onClose={closeModals}
        onSubmit={handleFormSubmit}
        peajeToEdit={selectedPeaje}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={closeModals}
        onConfirm={() => selectedPeaje && deleteMut.mutate(selectedPeaje.id)}
        title="Eliminar peaje"
        message={`¿Estás seguro de eliminar el peaje "${selectedPeaje?.name}"? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMut.isPending}
        variant="danger"
      />

      <TollUploadModal
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        isLoading={insertMutation.isPending}
      />

      <TollDeleteModal
        isOpen={isDeleteRecordsOpen}
        onClose={() => setDeleteRecordsOpen(false)}
        onConfirm={handleDeleteRecords}
        isLoading={deleteByRangeMutation.isPending}
      />
    </div>
  );
};