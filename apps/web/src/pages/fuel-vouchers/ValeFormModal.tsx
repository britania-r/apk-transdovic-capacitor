// File: apps/web/src/pages/fuel-vouchers/ValeFormModal.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { uploadVoucherFile } from './hooks/useFuelVouchers';
import styles from '../../components/ui/FormModal.module.css';

interface Vehicle {
  id: string;
  plate: string;
}

interface FuelVoucherEdit {
  id: string;
  voucher_date: string;
  voucher_time: string;
  supplier_code: string;
  dispatch_note: string | null;
  mileage: number | null;
  gallons: number | null;
  amount: number | null;
  vehicle_id: string;
  invoice: string | null;
  attachment: string | null;
  notes: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  valeToEdit: FuelVoucherEdit | null;
  vehicles: Vehicle[];
  isLoading: boolean;
}

const now = () => {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
};

const INITIAL = {
  voucher_date: '',
  voucher_time: '',
  supplier_code: '20127765279',
  dispatch_note: '',
  mileage: '',
  gallons: '',
  amount: '',
  vehicle_id: '',
  invoice: '',
  notes: '',
};

export const ValeFormModal = ({ isOpen, onClose, onSubmit, valeToEdit, vehicles, isLoading }: Props) => {
  const [form, setForm] = useState(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!valeToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (valeToEdit) {
      setForm({
        voucher_date: valeToEdit.voucher_date,
        voucher_time: valeToEdit.voucher_time?.slice(0, 5) || '',
        supplier_code: valeToEdit.supplier_code || '20127765279',
        dispatch_note: valeToEdit.dispatch_note || '',
        mileage: valeToEdit.mileage != null ? String(valeToEdit.mileage) : '',
        gallons: valeToEdit.gallons != null ? String(valeToEdit.gallons) : '',
        amount: valeToEdit.amount != null ? String(valeToEdit.amount) : '',
        vehicle_id: valeToEdit.vehicle_id,
        invoice: valeToEdit.invoice || '',
        notes: valeToEdit.notes || '',
      });
      setExistingAttachment(valeToEdit.attachment);
      setFile(null);
    } else {
      const { date, time } = now();
      setForm({ ...INITIAL, voucher_date: date, voucher_time: time });
      setExistingAttachment(null);
      setFile(null);
    }
  }, [isOpen, valeToEdit]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(e.target.name, e.target.value);

  const pricePerGal = useMemo(() => {
    const g = parseFloat(form.gallons);
    const a = parseFloat(form.amount);
    if (!g || g <= 0 || isNaN(a)) return '—';
    return `S/ ${(a / g).toFixed(2)}`;
  }, [form.gallons, form.amount]);

  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: v.plate }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!valid.includes(f.type)) {
      alert('Solo se permiten archivos PDF, JPG, PNG o WEBP');
      return;
    }
    setFile(f);
    setExistingAttachment(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExistingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let attachmentPath = existingAttachment;

      // Subir archivo si hay uno nuevo
      if (file) {
        const tempId = valeToEdit?.id || crypto.randomUUID();
        attachmentPath = await uploadVoucherFile(file, tempId);
      }

      const mileage = parseFloat(form.mileage);
      const gallons = parseFloat(form.gallons);
      const amount = parseFloat(form.amount);

      onSubmit({
        p_id: valeToEdit?.id || null,
        p_voucher_date: form.voucher_date,
        p_voucher_time: form.voucher_time,
        p_supplier_code: form.supplier_code,
        p_dispatch_note: form.dispatch_note || null,
        p_mileage: isNaN(mileage) ? null : mileage,
        p_gallons: isNaN(gallons) ? null : gallons,
        p_amount: isNaN(amount) ? null : amount,
        p_vehicle_id: form.vehicle_id,
        p_invoice: form.invoice || null,
        p_attachment: attachmentPath,
        p_notes: form.notes || null,
      });
    } catch {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const busy = isLoading || uploading;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className={isEdit ? 'bx bx-pencil' : 'bx bx-gas-pump'}></i>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isEdit ? 'Editar vale' : 'Nuevo vale de combustible'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isEdit ? 'Modifica los datos del vale' : 'Completa los datos para registrar un vale'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} type="button">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>

            {/* Fecha + Hora */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Fecha <span className={styles.required}>*</span>
                </label>
                <input
                  name="voucher_date"
                  type="date"
                  value={form.voucher_date}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Hora <span className={styles.required}>*</span>
                </label>
                <input
                  name="voucher_time"
                  type="time"
                  value={form.voucher_time}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
            </div>

            {/* Cod. Proveedor + Placa */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Cod. Proveedor</label>
                <input
                  value={form.supplier_code}
                  readOnly
                  className={styles.input}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className={styles.field}>
                <SearchableSelect
                  label="Placa"
                  options={vehicleOptions}
                  value={form.vehicle_id}
                  onChange={v => set('vehicle_id', v)}
                  placeholder="Seleccionar placa..."
                  required
                />
              </div>
            </div>

            {/* N° Despacho + Factura */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  N° Nota de despacho <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="dispatch_note"
                  value={form.dispatch_note}
                  onChange={handleChange}
                  placeholder="Ej. 001-12345"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Factura <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="invoice"
                  value={form.invoice}
                  onChange={handleChange}
                  placeholder="Ej. F123618134"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Kilometraje + Galones */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Kilometraje <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="mileage"
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.mileage}
                  onChange={handleChange}
                  placeholder="Ej. 125340.500"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Galones consumidos <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="gallons"
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.gallons}
                  onChange={handleChange}
                  placeholder="Ej. 45.250"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Importe + S/ /Gln */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Importe (S/) <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Ej. 580.00"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>S/ /Gln</label>
                <input
                  value={pricePerGal}
                  readOnly
                  className={styles.input}
                  style={{ opacity: 0.6, cursor: 'not-allowed', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Archivo adjunto */}
            <div className={styles.field}>
              <label className={styles.label}>
                Archivo adjunto <span className={styles.optional}>(PDF o imagen)</span>
              </label>
              {(file || existingAttachment) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className={`bx ${file?.type === 'application/pdf' || existingAttachment?.endsWith('.pdf') ? 'bx-file' : 'bx-image'}`} style={{ fontSize: '1.25rem' }}></i>
                  <span style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file ? file.name : existingAttachment?.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #e74c3c)', fontSize: '1.25rem' }}
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ) : (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className={styles.input}
                />
              )}
            </div>

            {/* Notas */}
            <div className={styles.field}>
              <label className={styles.label}>
                Notas <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones adicionales..."
                className={styles.input}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={busy || !form.vehicle_id}
            >
              {busy ? (
                <><i className="bx bx-loader-alt bx-spin"></i> {uploading ? 'Subiendo...' : 'Guardando...'}</>
              ) : (
                <><i className="bx bx-save"></i> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};