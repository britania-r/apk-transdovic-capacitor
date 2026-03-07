// File: apps/web/src/pages/operations/OperationDetailFormModal.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../../components/ui/FormModal.module.css';
import localStyles from './OperationFormModal.module.css';

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
      toast.error('Ingresa un monto válido');
      return;
    }

    setLoading(true);

    try {
      let url = null;
      const supabase = getSupabase();

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

      const { error } = await supabase.rpc('save_operation_detail', {
        p_operation_id: operationId,
        p_document_number: docNumber || null,
        p_amount: parseFloat(amount),
        p_voucher_url: url,
      } as any);

      if (error) throw error;

      toast.success('Factura agregada correctamente');
      queryClient.invalidateQueries({ queryKey: ['operation', operationId] });
      setAmount('');
      setDocNumber('');
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el detalle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bx bx-file"></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Agregar item</h3>
              <p className={styles.modalSubtitle}>Registra una factura o documento</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            <div className={styles.field}>
              <label className={styles.label}>
                N° Factura / Documento <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                placeholder="Ej. F001-456"
                autoFocus
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Monto <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Archivo adjunto <span className={styles.optional}>(PDF/Foto)</span>
              </label>
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
                className={localStyles.fileInput}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              ) : (
                <><i className="bx bx-plus"></i> Agregar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};