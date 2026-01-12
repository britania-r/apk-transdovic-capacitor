// File: apps/web/src/pages/purchases/PurchaseItemForm.tsx

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import Select from 'react-select';
import customReactSelectStyles from '../../styles/customReactSelectStyles';
import styles from './PurchaseItemForm.module.css';

// --- Tipos para los datos de los selectores ---
interface Product { id: string; name: string; code: string; }
interface Vehicle { id: string; plate: string; }
interface BotiquinItem { id: string; name: string; }
interface Service { id: string; name: string; }

interface Props {
  orderId: string;
  purchaseType: string;
  orderType: string;
  products: Product[];
  vehicles: Vehicle[];
  botiquinItems: BotiquinItem[];
  services: Service[];
}

const initialFormState = {
  quantity: 1,
  unit_price: '',
  currency: 'PEN',
  expiration_date: '',
  details: '',
  selectedProduct: null as { value: string; label: string } | null,
  service_description: '',
  selectedVehicle: null as { value: string; label: string } | null,
  selectedBotiquinItem: null as { value: string; label: string } | null,
  manual_code: '',
  serviceTarget: 'empresa' as 'empresa' | 'unidades',
  selectedService: null as { value: string; label: string } | null,
};

export const PurchaseItemForm = ({ orderId, purchaseType, orderType, products, vehicles, botiquinItems, services }: Props) => {
  const [form, setForm] = useState(initialFormState);
  const queryClient = useQueryClient();

  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` })), [products]);
  const vehicleOptions = useMemo(() => vehicles.map(v => ({ value: v.id, label: v.plate })), [vehicles]);
  const botiquinOptions = useMemo(() => botiquinItems.map(b => ({ value: b.id, label: b.name })), [botiquinItems]);
  const serviceOptions = useMemo(() => services.map(s => ({ value: s.id, label: s.name })), [services]);

  const addMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const { error } = await getSupabase().from('purchase_order_items').insert(newItem);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ítem agregado a la orden');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', orderId] });
      setForm(initialFormState);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0 || !form.unit_price) {
      toast.error('La cantidad y el precio unitario son obligatorios.');
      return;
    }

    let newItem: any = {
      purchase_order_id: orderId,
      quantity: form.quantity,
      unit_price: parseFloat(form.unit_price),
      currency: form.currency,
    };

    switch (purchaseType) {
      case 'OTROS':
        if (orderType === 'Orden de Servicio') {
          if (form.serviceTarget === 'empresa') {
            if (!form.service_description) return toast.error('La descripción del servicio es obligatoria.');
            newItem.service_description = form.service_description;
          } else {
            if (!form.selectedService || !form.selectedVehicle) return toast.error('Debe seleccionar un servicio y un vehículo.');
            newItem.service_id = form.selectedService.value;
            newItem.vehicle_id = form.selectedVehicle.value;
          }
        } else {
          if (!form.selectedProduct) return toast.error('Debe seleccionar un producto.');
          newItem.product_id = form.selectedProduct.value;
        }
        break;
      case 'SOAT':
      case 'REVISIÓN TÉCNICA':
        if (!form.selectedVehicle) return toast.error('Debe seleccionar un vehículo.');
        newItem.vehicle_id = form.selectedVehicle.value;
        newItem.details = form.details;
        break;
      case 'BOTIQUÍN':
        if (!form.selectedBotiquinItem || !form.selectedVehicle) return toast.error('Debe seleccionar un ítem y un vehículo.');
        newItem.first_aid_item_id = form.selectedBotiquinItem.value;
        newItem.vehicle_id = form.selectedVehicle.value;
        newItem.expiration_date = form.expiration_date || null;
        break;
      case 'EXTINTOR':
        if (!form.manual_code || !form.selectedVehicle) return toast.error('El código manual y el vehículo son obligatorios.');
        newItem.manual_code = form.manual_code;
        newItem.vehicle_id = form.selectedVehicle.value;
        break;
      default:
        return toast.error('Tipo de compra no reconocido.');
    }

    addMutation.mutate(newItem);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const renderSpecificFields = () => {
    switch (purchaseType) {
      case 'OTROS':
        if (orderType === 'Orden de Servicio') {
          return (
            <div className={styles.serviceContainer}>
              <div className={styles.radioGroup}>
                <label><input type="radio" value="empresa" checked={form.serviceTarget === 'empresa'} onChange={() => setForm(p => ({...p, serviceTarget: 'empresa'}))} /> Para la Empresa</label>
                <label><input type="radio" value="unidades" checked={form.serviceTarget === 'unidades'} onChange={() => setForm(p => ({...p, serviceTarget: 'unidades'}))} /> Para Unidades</label>
              </div>
              {form.serviceTarget === 'empresa' ? (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}><label>Descripción del Servicio</label><input name="service_description" value={form.service_description} onChange={handleInputChange} className={styles.input} /></div>
              ) : (
                <>
                  <div className={`${styles.inputGroup} ${styles.productSelect}`}><label>Servicio</label><Select options={serviceOptions} value={form.selectedService} onChange={val => setForm(p => ({...p, selectedService: val}))} styles={customReactSelectStyles} placeholder="Seleccionar..."/></div>
                  <div className={`${styles.inputGroup} ${styles.vehicleSelect}`}><label>Vehículo (Placa)</label><Select options={vehicleOptions} value={form.selectedVehicle} onChange={val => setForm(p => ({...p, selectedVehicle: val}))} styles={customReactSelectStyles} placeholder="Seleccionar..."/></div>
                </>
              )}
            </div>
          );
        }
        return (
          <div className={`${styles.inputGroup} ${styles.productSelect}`}><label>Producto</label><Select options={productOptions} value={form.selectedProduct} onChange={val => setForm(p => ({ ...p, selectedProduct: val }))} styles={customReactSelectStyles} placeholder="Seleccionar..." /></div>
        );
      case 'SOAT':
      case 'REVISIÓN TÉCNICA':
        return <>
          <div className={`${styles.inputGroup} ${styles.vehicleSelect}`}><label>Vehículo (Placa)</label><Select options={vehicleOptions} value={form.selectedVehicle} onChange={val => setForm(p => ({ ...p, selectedVehicle: val }))} styles={customReactSelectStyles} placeholder="Seleccionar..." /></div>
          <p className={styles.autoInfo}>La fecha de vencimiento se calculará automáticamente.</p>
        </>;
      case 'BOTIQUÍN':
        return <>
          <div className={`${styles.inputGroup} ${styles.productSelect}`}><label>Ítem de Botiquín</label><Select options={botiquinOptions} value={form.selectedBotiquinItem} onChange={val => setForm(p => ({ ...p, selectedBotiquinItem: val }))} styles={customReactSelectStyles} placeholder="Seleccionar..." /></div>
          <div className={`${styles.inputGroup} ${styles.vehicleSelect}`}><label>Vehículo (Placa)</label><Select options={vehicleOptions} value={form.selectedVehicle} onChange={val => setForm(p => ({ ...p, selectedVehicle: val }))} styles={customReactSelectStyles} placeholder="Seleccionar..." /></div>
          <div className={`${styles.inputGroup} ${styles.dateInput}`}><label>Fecha de Vencimiento</label><input type="date" name="expiration_date" value={form.expiration_date} onChange={handleInputChange} className={styles.input} /></div>
        </>;
      case 'EXTINTOR':
        return <>
          <div className={`${styles.inputGroup} ${styles.vehicleSelect}`}><label>Vehículo (Placa)</label><Select options={vehicleOptions} value={form.selectedVehicle} onChange={val => setForm(p => ({ ...p, selectedVehicle: val }))} styles={customReactSelectStyles} placeholder="Seleccionar..." /></div>
          <div className={`${styles.inputGroup} ${styles.codeInput}`}><label>Código Manual</label><input name="manual_code" value={form.manual_code} onChange={handleInputChange} className={styles.input} /></div>
          <p className={styles.autoInfo}>La fecha de vencimiento se calculará automáticamente.</p>
        </>;
      default:
        return <p>Seleccione un tipo de compra válido.</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formInline}>
      {renderSpecificFields()}
      <div className={`${styles.inputGroup} ${styles.quantityInput}`}><label>Cantidad</label><input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={styles.input} /></div>
      <div className={`${styles.inputGroup} ${styles.priceInput}`}><label>Precio Unitario</label><input type="number" step="0.01" min="0" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} className={styles.input} /></div>
      <div className={`${styles.inputGroup} ${styles.currencySelect}`}><label>Moneda</label><select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className={styles.select}><option value="PEN">S/</option><option value="USD">$</option></select></div>
      <button type="submit" className={styles.addButton} disabled={addMutation.isPending} title="Agregar Ítem"><i className='bx bx-plus'></i></button>
    </form>
  );
};