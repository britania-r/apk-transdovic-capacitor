// File: apps/web/src/pages/inventory-outputs/InventoryOutputFormModal.tsx
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import formStyles from '../../components/ui/FormModal.module.css';
import styles from './InventoryOutputFormModal.module.css';

interface Vehicle { id: string; plate: string; }
interface User { id: string; first_name: string; }
interface Product {
  id: string;
  name: string;
  code: string;
  stock: number;
  unit_name: string;
  is_fractional: boolean;
  sub_unit_name: string | null;
  sub_unit_id: string | null;
  units_per_package: number | null;
  unit_id: string;
}

interface OutputItem {
  tempId: string;
  product_id: string;
  product_name: string;
  product_code: string;
  vehicle_id: string;
  vehicle_plate: string;
  quantity: number;            // siempre en sub-unidad
  display_quantity: number;
  display_unit: string;
  unit_label: string;
  is_fractional: boolean;
  units_per_package: number | null;
  sub_unit_name: string | null;
  pkg_unit_name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (outputId: string) => void;
  vehicles: Vehicle[];
  users: User[];
  products: Product[];
}

const formatStockDisplay = (stock: number, p: Product): string => {
  if (!p.is_fractional || !p.units_per_package || !p.sub_unit_name) {
    return `${stock} ${p.unit_name}`;
  }
  const full = Math.floor(stock / p.units_per_package);
  const rem = +(stock % p.units_per_package).toFixed(2);
  if (full === 0) return `${stock} ${p.sub_unit_name}`;
  if (rem === 0) return `${stock} ${p.sub_unit_name} (${full} ${p.unit_name})`;
  return `${stock} ${p.sub_unit_name} (${full} ${p.unit_name} + ${rem} ${p.sub_unit_name})`;
};

export const InventoryOutputFormModal = ({ isOpen, onClose, onSuccess, vehicles, users, products }: Props) => {
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OutputItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addVehicleId, setAddVehicleId] = useState('');
  const [addProductId, setAddProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addUnit, setAddUnit] = useState<'sub' | 'pkg'>('sub');

  const userOptions = useMemo(() =>
    users.map(u => ({ value: u.id, label: u.first_name })), [users]);

  const vehicleOptions = useMemo(() =>
    vehicles.map(v => ({ value: v.id, label: v.plate })), [vehicles]);

  // Stock ya comprometido por producto (sumando items ya agregados)
  const committedStock = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => {
      map[i.product_id] = (map[i.product_id] || 0) + i.quantity;
    });
    return map;
  }, [items]);

  // Stock disponible real = stock del producto - lo ya comprometido
  const getAvailableStock = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return Number(product.stock) - (committedStock[productId] || 0);
  };

  const availableProducts = useMemo(() => {
    return products
      .filter(p => {
        const available = Number(p.stock) - (committedStock[p.id] || 0);
        return available > 0;
      })
      .map(p => {
        const available = Number(p.stock) - (committedStock[p.id] || 0);
        return {
          value: p.id,
          label: `${p.name} (${p.code})`,
          sublabel: `Disponible: ${formatStockDisplay(available, p)}`,
        };
      });
  }, [products, committedStock]);

  const selectedProduct = products.find(p => p.id === addProductId);

  const handleProductChange = (productId: string) => {
    setAddProductId(productId);
    setAddQuantity(1);
    setAddUnit('sub');
  };

  const unitSelectorOptions = useMemo(() => {
    if (!selectedProduct?.is_fractional) return [];
    return [
      { value: 'sub', label: selectedProduct.sub_unit_name || 'Sub-unidad' },
      { value: 'pkg', label: selectedProduct.unit_name },
    ];
  }, [selectedProduct]);

  const getRealQuantity = (qty: number, unit: 'sub' | 'pkg', product: Product): number => {
    if (!product.is_fractional || unit === 'sub') return qty;
    return qty * (product.units_per_package || 1);
  };

  const getMaxQuantity = (): number => {
    if (!selectedProduct) return 999;
    const available = getAvailableStock(selectedProduct.id);
    if (!selectedProduct.is_fractional || addUnit === 'sub') return available;
    return Math.floor(available / (selectedProduct.units_per_package || 1));
  };

  const handleAddItem = () => {
    if (!addVehicleId) {
      toast.error('Selecciona un vehículo');
      return;
    }
    if (!addProductId || !selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    if (addQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const realQty = getRealQuantity(addQuantity, addUnit, selectedProduct);
    const available = getAvailableStock(selectedProduct.id);

    if (realQty > available) {
      toast.error(`Stock insuficiente. Disponible: ${formatStockDisplay(available, selectedProduct)}`);
      return;
    }

    const vehicle = vehicles.find(v => v.id === addVehicleId);
    const unitLabel = selectedProduct.is_fractional
      ? (addUnit === 'pkg' ? selectedProduct.unit_name : (selectedProduct.sub_unit_name || selectedProduct.unit_name))
      : selectedProduct.unit_name;

    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_code: selectedProduct.code,
      vehicle_id: addVehicleId,
      vehicle_plate: vehicle?.plate || '—',
      quantity: realQty,
      display_quantity: addQuantity,
      display_unit: addUnit,
      unit_label: unitLabel,
      is_fractional: selectedProduct.is_fractional,
      units_per_package: selectedProduct.units_per_package,
      sub_unit_name: selectedProduct.sub_unit_name,
      pkg_unit_name: selectedProduct.unit_name,
    }]);

    setAddProductId('');
    setAddQuantity(1);
    setAddUnit('sub');
  };

  const handleRemoveItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const formatItemQuantity = (item: OutputItem): string => {
    if (!item.is_fractional) return `${item.quantity} ${item.pkg_unit_name}`;
    if (item.display_unit === 'pkg') {
      return `${item.display_quantity} ${item.pkg_unit_name} (${item.quantity} ${item.sub_unit_name})`;
    }
    return `${item.quantity} ${item.sub_unit_name}`;
  };

  // Agrupar items por vehículo para mostrar
  const itemsByVehicle = useMemo(() => {
    const map: Record<string, { plate: string; items: OutputItem[] }> = {};
    items.forEach(i => {
      if (!map[i.vehicle_id]) {
        map[i.vehicle_id] = { plate: i.vehicle_plate, items: [] };
      }
      map[i.vehicle_id].items.push(i);
    });
    return Object.entries(map);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return toast.error('Selecciona un responsable');
    if (items.length === 0) return toast.error('Agrega al menos un producto');

    setIsSubmitting(true);
    try {
      const { data: outputId, error } = await getSupabase().rpc('create_inventory_output', {
        p_responsible_user_id: userId,
        p_output_date: new Date().toISOString(),
        p_notes: notes || null,
        p_items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          vehicle_id: i.vehicle_id,
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

  const uniqueVehicles = new Set(items.map(i => i.vehicle_id)).size;

  return (
    <div className={formStyles.overlay} onClick={onClose}>
      <div className={`${formStyles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>

        <div className={formStyles.modalHeader}>
          <div className={formStyles.headerLeft}>
            <div className={formStyles.headerIcon}><i className="bx bx-export"></i></div>
            <div>
              <h3 className={formStyles.modalTitle}>Nueva salida de inventario</h3>
              <p className={formStyles.modalSubtitle}>Asigna productos a uno o más vehículos</p>
            </div>
          </div>
          <button onClick={onClose} className={formStyles.closeBtn} type="button"><i className="bx bx-x"></i></button>
        </div>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.formBody}>

            {/* Responsable + Notas */}
            <div className={formStyles.row}>
              <SearchableSelect
                label="Responsable"
                options={userOptions}
                value={userId}
                onChange={setUserId}
                placeholder="Buscar usuario..."
                required
              />
              <div className={formStyles.field}>
                <label className={formStyles.label}>Notas <span className={formStyles.optional}>(opcional)</span></label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observaciones de la salida..."
                  className={formStyles.input}
                />
              </div>
            </div>

            {/* Agregar items */}
            <div className={styles.addSection}>
              <span className={styles.addTitle}>Agregar productos</span>

              {/* Fila 1: Vehículo + Producto */}
              <div className={styles.addRow}>
                <div className={styles.addProduct}>
                  <SearchableSelect
                    options={vehicleOptions}
                    value={addVehicleId}
                    onChange={setAddVehicleId}
                    placeholder="Vehículo..."
                  />
                </div>
                <div className={styles.addProduct}>
                  <SearchableSelect
                    options={availableProducts}
                    value={addProductId}
                    onChange={handleProductChange}
                    placeholder="Producto..."
                  />
                </div>
              </div>

              {/* Fila 2: Unidad (si fraccional) + Cantidad + Botón */}
              <div className={styles.addRow}>
                {selectedProduct?.is_fractional && unitSelectorOptions.length > 0 && (
                  <div className={styles.addUnit}>
                    <SimpleSelect
                      options={unitSelectorOptions}
                      value={addUnit}
                      onChange={v => setAddUnit(v as 'sub' | 'pkg')}
                    />
                  </div>
                )}
                <div className={styles.addQty}>
                  <input
                    type="number"
                    min={selectedProduct?.is_fractional && addUnit === 'sub' ? '0.01' : '1'}
                    step={selectedProduct?.is_fractional && addUnit === 'sub' ? 'any' : '1'}
                    max={getMaxQuantity()}
                    value={addQuantity}
                    onChange={e => setAddQuantity(parseFloat(e.target.value) || 0)}
                    className={styles.qtyInput}
                    placeholder="Cant."
                  />
                </div>
                <button type="button" onClick={handleAddItem} className={styles.addBtn} disabled={!addProductId || !addVehicleId}>
                  <i className="bx bx-plus"></i>
                </button>
              </div>

              {selectedProduct && (
                <span className={styles.stockHint}>
                  Disponible: {formatStockDisplay(getAvailableStock(selectedProduct.id), selectedProduct)}
                </span>
              )}
            </div>

            {/* Items agrupados por vehículo */}
            {itemsByVehicle.length > 0 && (
              <div className={styles.itemsList}>
                {itemsByVehicle.map(([vehicleId, group]) => (
                  <div key={vehicleId} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <i className="bx bxs-truck" style={{ color: 'var(--color-primary)', fontSize: '18px' }}></i>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{group.plate}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        ({group.items.length} {group.items.length === 1 ? 'producto' : 'productos'})
                      </span>
                    </div>
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
                        {group.items.map(item => (
                          <tr key={item.tempId}>
                            <td className={styles.productName}>{item.product_name}</td>
                            <td className={styles.monoText}>{item.product_code}</td>
                            <td className={styles.qtyCell}>{formatItemQuantity(item)}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveItem(item.tempId)} className={styles.removeBtn}>
                                <i className="bx bx-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={formStyles.modalFooter}>
            <button type="button" onClick={onClose} className={formStyles.cancelBtn} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className={formStyles.submitBtn} disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? (
                <><i className="bx bx-loader-alt bx-spin"></i> Registrando...</>
              ) : (
                <><i className="bx bx-check"></i> Registrar salida ({items.length} productos, {uniqueVehicles} {uniqueVehicles === 1 ? 'vehículo' : 'vehículos'})</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};