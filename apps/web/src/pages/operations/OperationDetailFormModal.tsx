import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../users/UserFormModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operationId: string;
}

export const OperationDetailFormModal = ({ isOpen, onClose, operationId }: Props) => {
  const [amount, setAmount] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
        toast.error("Ingresa un monto válido");
        return;
    }

    setLoading(true);

    try {
        let url = null;
        const supabase = getSupabase();

        // 1. Subir archivo si existe
        if (file) {
            const fileName = `det-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('operation-evidences')
                .upload(`public/${fileName}`, file);
            
            if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
            
            const { data: urlData } = supabase.storage
                .from('operation-evidences')
                .getPublicUrl(data.path);
            url = urlData.publicUrl;
        }

        // 2. Guardar detalle en BD usando RPC
        // Nota: Asegúrate de que tu RPC 'save_operation_detail' acepte estos parámetros
        const params = {
            p_operation_id: operationId,
            p_document_number: docNumber || null, // Convertir string vacío a null
            p_amount: parseFloat(amount),
            p_voucher_url: url
        };

        // Usamos 'as any' para evitar conflictos de tipado estricto si el RPC no está tipado globalmente
        const { error } = await supabase.rpc('save_operation_detail', params as any);

        if (error) throw error;

        toast.success('Factura agregada correctamente');
        
        // Recargar la página de detalles (recalcula el total)
        queryClient.invalidateQueries({ queryKey: ['operation', operationId] });
        
        // Limpiar formulario y cerrar
        setAmount('');
        setDocNumber('');
        setFile(null);
        onClose();

    } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Error al guardar el detalle');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h3>Agregar Item / Factura</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* N° DOCUMENTO */}
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>N° Factura / Documento</label>
                <input 
                    value={docNumber} 
                    onChange={e => setDocNumber(e.target.value)} 
                    placeholder="Ej: F001-456"
                    autoFocus
                />
            </div>

            {/* MONTO */}
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Monto</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    placeholder="0.00"
                />
            </div>

            {/* ARCHIVO */}
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Archivo Adjunto (PDF/Foto)</label>
                <input 
                    type="file" 
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                    accept="image/*,.pdf"
                />
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
                    Cancelar
                </button>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Guardando...' : 'Agregar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};