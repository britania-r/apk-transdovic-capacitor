// File: apps/web/src/pages/operations/OperationDetailManager.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import styles from './OperationDetailManager.module.css';

export interface DetailItem {
  id: string;
  amount: number;
  document_number: string;
  file?: File;
  voucher_url?: string;
}

interface Props {
  details: DetailItem[];
  onChange: (details: DetailItem[]) => void;
}

export const OperationDetailManager = ({ details, onChange }: Props) => {
  const [amount, setAmount] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    if (!amount || !docNumber) return toast.error('Monto y N° Documento son obligatorios');

    setUploading(true);
    let url = '';

    if (file) {
      const fileName = `detail-${Date.now()}-${file.name}`;
      const { data, error } = await getSupabase().storage
        .from('operation-evidences')
        .upload(`public/${fileName}`, file);
      if (error) {
        toast.error('Error subiendo archivo');
        setUploading(false);
        return;
      }
      const { data: urlData } = getSupabase().storage
        .from('operation-evidences')
        .getPublicUrl(data.path);
      url = urlData.publicUrl;
    }

    const newItem: DetailItem = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      document_number: docNumber,
      voucher_url: url,
    };

    onChange([...details, newItem]);
    setAmount('');
    setDocNumber('');
    setFile(null);
    setUploading(false);
  };

  const removeDetail = (id: string) => {
    onChange(details.filter(d => d.id !== id));
  };

  const totalAmount = details.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Desglose de Facturas</h4>

      {/* Formulario inline */}
      <div className={styles.addForm}>
        <div className={styles.addField}>
          <label className={styles.addLabel}>N° Doc</label>
          <input
            value={docNumber}
            onChange={e => setDocNumber(e.target.value)}
            placeholder="F001-..."
            className={styles.addInput}
          />
        </div>
        <div className={styles.addField}>
          <label className={styles.addLabel}>Monto</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className={styles.addInput}
          />
        </div>
        <div className={styles.addField}>
          <label className={styles.addLabel}>Adjunto</label>
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className={styles.fileInput}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={uploading}
          className={styles.addBtn}
        >
          {uploading ? <i className="bx bx-loader-alt bx-spin"></i> : <i className="bx bx-plus"></i>}
        </button>
      </div>

      {/* Tabla de items */}
      {details.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Documento</th>
                <th className={styles.thRight}>Monto</th>
                <th className={styles.thCenter}>Archivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {details.map(d => (
                <tr key={d.id}>
                  <td className={styles.monoText}>{d.document_number}</td>
                  <td className={styles.amountCell}>S/ {d.amount.toFixed(2)}</td>
                  <td className={styles.centerCell}>
                    {d.voucher_url ? (
                      <a href={d.voucher_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                        <i className="bx bx-file"></i> Ver
                      </a>
                    ) : '—'}
                  </td>
                  <td className={styles.rightCell}>
                    <button
                      type="button"
                      onClick={() => removeDetail(d.id)}
                      className={styles.removeBtn}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td className={styles.totalLabel}>TOTAL</td>
                <td className={styles.totalAmount}>S/ {totalAmount.toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};