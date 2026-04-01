// File: apps/web/src/pages/farms/ImportConversionModal.tsx
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import styles from '../../components/ui/FormModal.module.css';
import own from './ImportConversionModal.module.css';

interface ConversionRow {
  cm: number | null;
  mm: number;
  liters: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tankId: string;
  tankName: string;
  farmId: string;
}

const TYPE_OPTIONS = [
  { value: 'decimal', label: 'Decimal — CM + MM → L (3 columnas)' },
  { value: 'integer', label: 'Entero — MM → L (2 columnas)' },
];

const PREVIEW_LIMIT = 10;

export const ImportConversionModal = ({ isOpen, onClose, tankId, tankName, farmId }: Props) => {
  const [type, setType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ConversionRow[]>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const resetState = () => {
    setType('');
    setFile(null);
    setParsedRows([]);
    setParseError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSVLine = (line: string): string[] => {
    // Soporta separadores: coma, punto y coma, tab
    if (line.includes('\t')) return line.split('\t').map(s => s.trim());
    if (line.includes(';')) return line.split(';').map(s => s.trim());
    return line.split(',').map(s => s.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setParseError('');
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
          setParseError('El archivo está vacío o solo tiene encabezados.');
          return;
        }

        // Detectar si la primera fila es encabezado (no numérica)
        const firstDataLine = parseCSVLine(lines[0]);
        const hasHeader = isNaN(Number(firstDataLine[firstDataLine.length - 1]));
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const expectedCols = type === 'decimal' ? 3 : 2;
        const rows: ConversionRow[] = [];
        let errorLine = 0;

        for (let i = 0; i < dataLines.length; i++) {
          const cols = parseCSVLine(dataLines[i]);
          if (cols.length < expectedCols) {
            errorLine = i + (hasHeader ? 2 : 1);
            break;
          }

          if (type === 'decimal') {
            const cm = Number(cols[0]);
            const mm = Number(cols[1]);
            const liters = Number(cols[2]);
            if (isNaN(cm) || isNaN(mm) || isNaN(liters)) {
              errorLine = i + (hasHeader ? 2 : 1);
              break;
            }
            rows.push({ cm, mm, liters });
          } else {
            const mm = Number(cols[0]);
            const liters = Number(cols[1]);
            if (isNaN(mm) || isNaN(liters)) {
              errorLine = i + (hasHeader ? 2 : 1);
              break;
            }
            rows.push({ cm: null, mm, liters });
          }
        }

        if (errorLine > 0) {
          setParseError(`Error en la fila ${errorLine}: datos inválidos o columnas insuficientes.`);
          return;
        }

        if (rows.length === 0) {
          setParseError('No se encontraron filas válidas.');
          return;
        }

        setParsedRows(rows);
      } catch {
        setParseError('Error al leer el archivo. Verifica el formato.');
      }
    };
    reader.readAsText(selected);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();

      // 1. Eliminar conversiones existentes del tanque
      const { error: deleteError } = await supabase
        .from('tank_conversions')
        .delete()
        .eq('tank_id', tankId);
      if (deleteError) throw new Error(deleteError.message);

      // 2. Insertar en batches de 500
      const BATCH_SIZE = 500;
      const records = parsedRows.map(row => ({
        tank_id: tankId,
        type,
        cm: row.cm,
        mm: row.mm,
        liters: row.liters,
      }));

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('tank_conversions').insert(batch);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`Tabla importada: ${parsedRows.length} filas`);
      queryClient.invalidateQueries({ queryKey: ['farm_details', farmId] });
      queryClient.invalidateQueries({ queryKey: ['tank_conversions_summary', farmId] });
      handleClose();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || parsedRows.length === 0) return;
    importMutation.mutate();
  };

  if (!isOpen) return null;

  const previewRows = parsedRows.slice(0, PREVIEW_LIMIT);
  const hasMore = parsedRows.length > PREVIEW_LIMIT;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={`${styles.modal} ${own.compactModal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-import"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Importar tabla de conversión</h3>
              <p className={styles.modalSubtitle}>{tankName}</p>
            </div>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            {/* Tipo */}
            <SimpleSelect
              label="Tipo de tabla"
              options={TYPE_OPTIONS}
              value={type}
              onChange={v => { setType(v); setParsedRows([]); setParseError(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              placeholder="Seleccionar tipo..."
              required
            />

            {/* Hint del formato */}
            {type && (
              <div className={own.formatHint}>
                <i className="bx bx-info-circle"></i>
                <span>
                  {type === 'decimal'
                    ? 'El archivo debe tener 3 columnas: CM, MM, L'
                    : 'El archivo debe tener 2 columnas: MM, L'}
                </span>
              </div>
            )}

            {/* Input archivo */}
            {type && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Archivo <span className={styles.required}>*</span>
                </label>
                <div className={own.fileInput}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleFileChange}
                    id="conversion-file"
                  />
                  <label htmlFor="conversion-file" className={own.fileLabel}>
                    <i className="bx bx-cloud-upload"></i>
                    <span>{file ? file.name : 'Seleccionar archivo CSV o Excel'}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Error de parseo */}
            {parseError && (
              <div className={own.parseError}>
                <i className="bx bx-error-circle"></i>
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview */}
            {parsedRows.length > 0 && (
              <div className={own.previewSection}>
                <div className={own.previewHeader}>
                  <span className={own.previewTitle}>
                    <i className="bx bx-table"></i>
                    Vista previa
                  </span>
                  <span className={own.previewCount}>{parsedRows.length} filas</span>
                </div>

                <div className={own.previewTableWrapper}>
                  <table className={own.previewTable}>
                    <thead>
                      <tr>
                        {type === 'decimal' && <th>CM</th>}
                        <th>MM</th>
                        <th>L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {type === 'decimal' && <td>{row.cm}</td>}
                          <td>{row.mm}</td>
                          <td>{row.liters}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <p className={own.previewMore}>
                    ...y {parsedRows.length - PREVIEW_LIMIT} filas más
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelBtn}
              disabled={importMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!type || parsedRows.length === 0 || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Importando...</>
              ) : (
                <><i className="bx bx-import"></i> Importar {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};