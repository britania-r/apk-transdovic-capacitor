// File: apps/web/src/pages/inventory-outputs/InventoryOutputFormModal.tsx
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './InventoryOutputFormModal.module.css';

interface Vehicle { id: string; plate: string; }
interface User { id: string; first_name: string; }
interface Product { id: string; name: string; code: string; stock: number; }

interface OutputItem {
  tempId: string;
  product_id: string;
  product_name: string;
  product_code: string;
  available_stock: number;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (outputId: string) => void;
  vehicles: Vehicle[];
  users: User[];
  products: Product[];
}

export const InventoryOutputFormModal = ({ isOpen, onClose, onSuccess, vehicles, users, products }: Props) => {
  const [vehicleId, setVehicleId] = useState('');
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OutputItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temp add item state
  const [addProductId, setAddProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);

  const vehicleOptions = useMemo(() =>
    vehicles.map(v => ({ value: v.id, label: v.plate })), [vehicles]);

  const userOptions = useMemo(() =>
    users.map(u => ({ value: u.id, label: u.first_name })), [users]);

  // Filtrar productos con stock > 0 y que no estén ya agregados
  const availableProducts = useMemo(() => {
    const addedIds = new Set(items.map(i => i.product_id));
    return products
      .filter(p => p.stock > 0 && !addedIds.has(p.id))
      .map(p => ({
        value: p.id,
        label: `${p.name} (${p.code})`,
        sublabel: `Stock: ${p.stock}`,
      }));
  }, [products, items]);

  const selectedProduct = products.find(p => p.id === addProductId);

  const handleAddItem = () => {
    if (!addProductId || !selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    if (addQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (addQuantity > selectedProduct.stock) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock}`);
      return;
    }

    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_code: selectedProduct.code,
      available_stock: selectedProduct.stock,
      quantity: addQuantity,
    }]);

    setAddProductId('');
    setAddQuantity(1);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId) return toast.error('Selecciona un vehículo');
    if (!userId) return toast.error('Selecciona un responsable');
    if (items.length === 0) return toast.error('Agrega al menos un producto');

    setIsSubmitting(true);
    try {
      const { data: outputId, error } = await getSupabase().rpc('create_inventory_output', {
        p_vehicle_id: vehicleId,
        p_responsible_user_id: userId,
        p_output_date: new Date().toISOString(),
        p_notes: notes || null,
        p_items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      } as any);

      if (error) throw error;
      toast.success('Salida registrada correctamente');
      onSuccess(outputId);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la salida');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={`${formStyles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>

        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}><i className="bx bx-export"></i></div>
            <div>
              <h3 className={formStyles.modalTitle}>Nueva salida de inventario</h3>
              <p className={formStyles.modalSubtitle}>Asigna productos a un vehículo</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button"><i className="bx bx-x"></i></button>
        </div>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>

            {/* Vehículo + Responsable */}
            <div className={formStyles.row}>
              <SearchableSelect
                label="Vehículo"
                options={vehicleOptions}
                value={vehicleId}
                onChange={setVehicleId}
                placeholder="Buscar placa..."
                required
              />
              <SearchableSelect
                label="Responsable"
                options={userOptions}
                value={userId}
                onChange={setUserId}
                placeholder="Buscar usuario..."
                required
              />
            </div>

            {/* Notas */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>Notas <span className={formStyles.optional}>(opcional)</span></label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones de la salida..."
                className={formStyles.input}
              />
            </div>

            {/* Agregar productos */}
            <div className={styles.addSection}>
              <span className={styles.addTitle}>Agregar productos</span>
              <div className={styles.addRow}>
                <div className={styles.addProduct}>
                  <SearchableSelect
                    options={availableProducts}
                    value={addProductId}
                    onChange={setAddProductId}
                    placeholder="Buscar producto..."
                  />
                </div>
                <div className={styles.addQty}>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.stock || 999}
                    value={addQuantity}
                    onChange={e => setAddQuantity(parseInt(e.target.value) || 1)}
                    className={styles.qtyInput}
                    placeholder="Cant."
                  />
                </div>
                <button type="button" onClick={handleAddItem} className={styles.addBtn} disabled={!addProductId}>
                  <i className="bx bx-plus"></i>
                </button>
              </div>
              {selectedProduct && (
                <span className={styles.stockHint}>Stock disponible: {selectedProduct.stock}</span>
              )}
            </div>

            {/* Lista de items agregados */}
            {items.length > 0 && (
              <div className={styles.itemsList}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.tempId}>
                        <td className={styles.productName}>{item.product_name}</td>
                        <td className={styles.monoText}>{item.product_code}</td>
                        <td className={styles.qtyCell}>{item.quantity}</td>
                        <td>
                          <button type="button" onClick={() => handleRemoveItem(item.tempId)} className={styles.removeBtn}>
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.totalRow}>
                      <td colSpan={2} className={styles.totalLabel}>Total</td>
                      <td className={styles.totalQty}>{totalQuantity}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className={formStyles.modalFooter}>
            <button type="button" onClick={onClose} className={formStyles.cancelBtn} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={formStyles.submitBtn} disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Registrando...</>
              ) : (
                <><i className="bx bx-check"></i> Registrar salida ({items.length} productos)</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};