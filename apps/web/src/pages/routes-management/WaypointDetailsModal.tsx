import { useState, useEffect, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import styles from '../../pages/users/UserFormModal.module.css';
import tabStyles from './WaypointDetailsModal.module.css';

// ============================================================================
// TIPOS (Sin cambios)
// ============================================================================
export interface Farm {
  id: string;
  name: string;
  excel_formula: string | null;
  farm_tanks: { id: string; name: string; }[];
}

interface TankReadingState {
  tankId: string;
  tankName: string;
  inputType: 'litros' | 'kg';
  rValue: string;
  directKg: string;
  temperature: string;
  observations: string;
}

interface Props {
  waypoint: Farm | null;
  onClose: () => void;
  evaluateFormula: (formula: string, value: number) => number;
}

// ============================================================================
// COMPONENTE
// ============================================================================
export const WaypointDetailsModal = ({ waypoint, onClose, evaluateFormula }: Props) => {
  const [tankReadings, setTankReadings] = useState<TankReadingState[]>([]);
  const [sharedData, setSharedData] = useState({
    seal_in: '',
    seal_out: '',
    remissionGuideFile: null as File | null,
  });

  const isOpen = !!waypoint;

  useEffect(() => {
    if (waypoint) {
      const initialTankReadings = waypoint.farm_tanks.map(tank => ({
        tankId: tank.id,
        tankName: tank.name,
        inputType: 'litros',
        rValue: '',
        directKg: '',
        temperature: '4.00',
        observations: '',
      }));
      setTankReadings(initialTankReadings);
      setSharedData({ seal_in: '', seal_out: '', remissionGuideFile: null });
    }
  }, [waypoint]);

  const handleTankChange = (index: number, field: keyof TankReadingState, value: string) => {
    const updatedReadings = [...tankReadings];
    updatedReadings[index] = { ...updatedReadings[index], [field]: value };
    setTankReadings(updatedReadings);
  };
  
  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSharedData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSharedData(prev => ({ ...prev, remissionGuideFile: e.target.files![0] }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Registro de Parada: {waypoint.name}</h3>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        <Tab.Group defaultIndex={0}>
          <Tab.List className={tabStyles.tabList}>
            {tankReadings.map(tank => (
              <Tab as={Fragment} key={tank.tankId}>
                {({ selected }) => <button className={selected ? tabStyles.tabActive : tabStyles.tabInactive}>{tank.tankName}</button>}
              </Tab>
            ))}
            {/* NUEVA PESTAÑA PARA PRECINTOS */}
            <Tab as={Fragment}>
              {({ selected }) => <button className={selected ? tabStyles.tabActive : tabStyles.tabInactive}>Precintos</button>}
            </Tab>
            <Tab as={Fragment}>
              {({ selected }) => <button className={selected ? tabStyles.tabActive : tabStyles.tabInactive}>Guías</button>}
            </Tab>
          </Tab.List>

          <Tab.Panels className={tabStyles.tabPanels}>
            {tankReadings.map((tankData, index) => {
              const rValueNum = parseFloat(tankData.rValue) || 0;
              let calculatedLitres = rValueNum;
              if (waypoint.excel_formula && tankData.inputType === 'litros') {
                try { calculatedLitres = evaluateFormula(waypoint.excel_formula, rValueNum); } 
                catch (e) { calculatedLitres = NaN; }
              }
              const finalKgFromLitres = calculatedLitres * 1.03;

              return (
                <Tab.Panel key={tankData.tankId} className={tabStyles.tabPanelContent}>
                  <div className={tabStyles.formGrid}>
                    <div className={`${styles.inputGroup} ${tabStyles.fullWidth}`}>
                      <label>Modo de Ingreso</label>
                      {/* CAMBIO: BOTONES EN LUGAR DE SELECT */}
                      <div className={tabStyles.inputModeContainer}>
                        <button 
                          onClick={() => handleTankChange(index, 'inputType', 'litros')} 
                          className={tankData.inputType === 'litros' ? tabStyles.modeButtonActive : tabStyles.modeButton}>
                          Por Litros (calculado)
                        </button>
                        <button 
                          onClick={() => handleTankChange(index, 'inputType', 'kg')} 
                          className={tankData.inputType === 'kg' ? tabStyles.modeButtonActive : tabStyles.modeButton}>
                          Por Kg (directo)
                        </button>
                      </div>
                    </div>

                    {tankData.inputType === 'litros' ? (
                      <>
                        <div className={styles.inputGroup}><label>Valor "R"</label><input type="number" value={tankData.rValue} onChange={e => handleTankChange(index, 'rValue', e.target.value)} placeholder="Valor medido" className={styles.input} /></div>
                        {/* CAMBIO: Litros sin decimales */}
                        <div className={styles.inputGroup}><label>Litros Calculados</label><input value={isNaN(calculatedLitres) ? 'Error Fórmula' : Math.round(calculatedLitres)} readOnly className={`${styles.input} ${tabStyles.readOnlyInput}`} /></div>
                        <div className={styles.inputGroup}><label>Kg Finales (Calculados)</label><input value={isNaN(finalKgFromLitres) ? 'Error' : finalKgFromLitres.toFixed(2)} readOnly className={`${styles.input} ${tabStyles.readOnlyInput}`} /></div>
                      </>
                    ) : (
                      <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}><label>Kg Finales (Directos)</label><input type="number" value={tankData.directKg} onChange={e => handleTankChange(index, 'directKg', e.target.value)} placeholder="Ingrese los Kg" className={styles.input} /></div>
                    )}
                    
                    <div className={styles.inputGroup}><label>Temperatura (°C)</label><input type="number" step="0.01" value={tankData.temperature} onChange={e => handleTankChange(index, 'temperature', e.target.value)} className={styles.input} /></div>
                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Observaciones</label><textarea value={tankData.observations} onChange={e => handleTankChange(index, 'observations', e.target.value)} className={styles.textarea} rows={1}></textarea></div>
                  </div>
                </Tab.Panel>
              );
            })}

            {/* NUEVO PANEL PARA PRECINTOS */}
            <Tab.Panel className={tabStyles.tabPanelContent}>
              <div className={tabStyles.precintosPanel}>
                <div className={styles.inputGroup}><label>Precinto de Ingreso (P.I.)</label><input name="seal_in" value={sharedData.seal_in} onChange={handleSharedChange} className={styles.input} /></div>
                <div className={styles.inputGroup}><label>Precinto de Salida (P.S.)</label><input name="seal_out" value={sharedData.seal_out} onChange={handleSharedChange} className={styles.input} /></div>
              </div>
            </Tab.Panel>

            <Tab.Panel className={tabStyles.tabPanelContent}>
              <div className={styles.inputGroup}><label>Guía de Remisión (PDF)</label><input type="file" accept=".pdf" onChange={handleFileChange} className={styles.input} />
                {sharedData.remissionGuideFile && <p className={tabStyles.fileName}>Archivo seleccionado: {sharedData.remissionGuideFile.name}</p>}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className={styles.actions}>
          {/* CAMBIO: BOTÓN CON ESTILO */}
          <button onClick={onClose} className={styles.submitButton}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};