import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import styles from '../users/UserFormModal.module.css';

export interface DetailItem {
  id: string; // Temporal ID
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

    // Subir archivo inmediatamente al agregar a la lista (Estrategia más segura)
    if (file) {
        const fileName = `detail-${Date.now()}-${file.name}`;
        const { data, error } = await getSupabase().storage.from('operation-evidences').upload(`public/${fileName}`, file);
        if (error) {
            toast.error('Error subiendo archivo');
            setUploading(false);
            return;
        }
        const { data: urlData } = getSupabase().storage.from('operation-evidences').getPublicUrl(data.path);
        url = urlData.publicUrl;
    }

    const newItem: DetailItem = {
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        document_number: docNumber,
        voucher_url: url
    };

    onChange([...details, newItem]);
    
    // Reset inputs
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
    <div style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#374151' }}>Desglose de Facturas</h4>
      
      {/* INPUTS PEQUEÑOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
        <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>N° Doc</label>
            <input value={docNumber} onChange={e => setDocNumber(e.target.value)} style={{ padding: '5px' }} />
        </div>
        <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>Monto</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: '5px' }} />
        </div>
        <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>Adjunto</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ fontSize: '0.8rem' }} />
        </div>
        <button 
            type="button" 
            onClick={handleAdd} 
            disabled={uploading}
            style={{ padding: '8px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
            {uploading ? '...' : '+'}
        </button>
      </div>

      {/* LISTA */}
      <table style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
                <th style={{ textAlign: 'left', padding: '5px' }}>Doc</th>
                <th style={{ textAlign: 'right', padding: '5px' }}>Monto</th>
                <th style={{ textAlign: 'center', padding: '5px' }}>File</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            {details.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px' }}>{d.document_number}</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>S/ {d.amount.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                        {d.voucher_url && <a href={d.voucher_url} target="_blank" style={{color:'#2563eb'}}>Ver</a>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                        <button type="button" onClick={() => removeDetail(d.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                    </td>
                </tr>
            ))}
        </tbody>
        <tfoot>
            <tr>
                <td style={{ fontWeight: 'bold', paddingTop: '10px' }}>TOTAL</td>
                <td style={{ fontWeight: 'bold', textAlign: 'right', paddingTop: '10px' }}>S/ {totalAmount.toFixed(2)}</td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
};