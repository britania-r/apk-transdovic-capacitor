// File: apps/web/src/pages/purchases/PurchaseItemForm.tsx
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { SimpleSelect } from '../../components/ui/SimpleSelect';
import styles from './PurchaseItemForm.module.css';

interface Product { id: string; name: string; code: string; }
interface Vehicle { id: string; plate: string; }
interface BotiquinItem { id: string; name: string; }
interface Service { id: string; name: string; }

interface Props {
  orderId: string;
  purchaseType: string;
  orderType: string;
  currency: string;
  products: Product[];
  vehicles: Vehicle[];
  botiquinItems: BotiquinItem[];
  services: Service[];
}

const INITIAL = {
  quantity: 1,
  unit_price: '',
  expiration_date: '',
  details: '',
  product_id: '',
  service_description: '',
  vehicle_id: '',
  botiquin_item_id: '',
  manual_code: '',
  serviceTarget: 'empresa' as 'empresa' | 'unidades',
  service_id: '',
};

export const PurchaseItemForm = ({
  orderId, purchaseType, orderType, currency,
  products, vehicles, botiquinItems, services,
}: Props) => {
  const [form, setForm] = useState(INITIAL);
  const queryClient = useQueryClient();

  const productOptions = useMemo(() =>
    products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [products]
  );
  const vehicleOptions = useMemo(() =>
    vehicles.map(v => ({ value: v.id, label: v.plate })),
    [vehicles]
  );
  const botiquinOptions = useMemo(() =>
    botiquinItems.map(b => ({ value: b.id, label: b.name })),
    [botiquinItems]
  );
  const serviceOptions = useMemo(() =>
    services.map(s => ({ value: s.id, label: s.name })),
    [services]
  );

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const { error } = await getSupabase().from('purchase_order_items').insert(newItem);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ítem agregado');
      queryClient.invalidateQueries({ queryKey: ['purchase_order_details', orderId] });
      setForm(INITIAL);
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0 || !form.unit_price) {
      toast.error('Cantidad y precio unitario son obligatorios');
      return;
    }

    let newItem: any = {
      purchase_order_id: orderId,
      quantity: form.quantity,
      unit_price: parseFloat(form.unit_price),
      currency,
    };

    switch (purchaseType) {
      case 'OTROS':
        if (orderType === 'Orden de Servicio') {
          if (form.serviceTarget === 'empresa') {
            if (!form.service_description) return toast.error('La descripción del servicio es obligatoria');
            newItem.service_description = form.service_description;
          } else {
            if (!form.service_id || !form.vehicle_id) return toast.error('Selecciona un servicio y un vehículo');
            newItem.service_id = form.service_id;
            newItem.vehicle_id = form.vehicle_id;
          }
        } else {
          if (!form.product_id) return toast.error('Selecciona un producto');
          newItem.product_id = form.product_id;
        }
        break;
      case 'SOAT':
      case 'REVISIÓN TÉCNICA':
        if (!form.vehicle_id) return toast.error('Selecciona un vehículo');
        newItem.vehicle_id = form.vehicle_id;
        newItem.details = form.details;
        break;
      case 'BOTIQUÍN':
        if (!form.botiquin_item_id || !form.vehicle_id) return toast.error('Selecciona un ítem y un vehículo');
        newItem.first_aid_item_id = form.botiquin_item_id;
        newItem.vehicle_id = form.vehicle_id;
        break;
      case 'EXTINTOR':
        if (!form.manual_code || !form.vehicle_id) return toast.error('Código manual y vehículo son obligatorios');
        newItem.manual_code = form.manual_code;
        newItem.vehicle_id = form.vehicle_id;
        break;
      default:
        return toast.error('Tipo de compra no reconocido');
    }

    addMutation.mutate(newItem);
  };

  const renderSpecificFields = () => {
    switch (purchaseType) {
      case 'OTROS':
        if (orderType === 'Orden de Servicio') {
          return (
            <>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    checked={form.serviceTarget === 'empresa'}
                    onChange={() => set('serviceTarget', 'empresa')}
                  />
                  Para la empresa
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    checked={form.serviceTarget === 'unidades'}
                    onChange={() => set('serviceTarget', 'unidades')}
                  />
                  Para unidades
                </label>
              </div>
              {form.serviceTarget === 'empresa' ? (
                <div className={styles.fieldWide}>
                  <label className={styles.label}>Descripción del servicio</label>
                  <input
                    value={form.service_description}
                    onChange={e => set('service_description', e.target.value)}
                    placeholder="Describe el servicio..."
                    className={styles.input}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.fieldFlex}>
                    <SearchableSelect
                      label="Servicio"
                      options={serviceOptions}
                      value={form.service_id}
                      onChange={v => set('service_id', v)}
                      placeholder="Seleccionar..."
                    />
                  </div>
                  <div className={styles.fieldSmall}>
                    <SearchableSelect
                      label="Vehículo"
                      options={vehicleOptions}
                      value={form.vehicle_id}
                      onChange={v => set('vehicle_id', v)}
                      placeholder="Placa..."
                    />
                  </div>
                </>
              )}
            </>
          );
        }
        return (
          <div className={styles.fieldFlex}>
            <SearchableSelect
              label="Producto"
              options={productOptions}
              value={form.product_id}
              onChange={v => set('product_id', v)}
              placeholder="Buscar producto..."
            />
          </div>
        );

      case 'SOAT':
      case 'REVISIÓN TÉCNICA':
        return (
          <div className={styles.fieldSmall}>
            <SearchableSelect
              label="Vehículo"
              options={vehicleOptions}
              value={form.vehicle_id}
              onChange={v => set('vehicle_id', v)}
              placeholder="Placa..."
            />
          </div>
        );

      case 'BOTIQUÍN':
        return (
          <>
            <div className={styles.fieldFlex}>
              <SearchableSelect
                label="Ítem de botiquín"
                options={botiquinOptions}
                value={form.botiquin_item_id}
                onChange={v => set('botiquin_item_id', v)}
                placeholder="Seleccionar..."
              />
            </div>
            <div className={styles.fieldSmall}>
              <SearchableSelect
                label="Vehículo"
                options={vehicleOptions}
                value={form.vehicle_id}
                onChange={v => set('vehicle_id', v)}
                placeholder="Placa..."
              />
            </div>
          </>
        );

      case 'EXTINTOR':
        return (
          <>
            <div className={styles.fieldSmall}>
              <SearchableSelect
                label="Vehículo"
                options={vehicleOptions}
                value={form.vehicle_id}
                onChange={v => set('vehicle_id', v)}
                placeholder="Placa..."
              />
            </div>
            <div className={styles.fieldSmall}>
              <label className={styles.label}>Código manual</label>
              <input
                value={form.manual_code}
                onChange={e => set('manual_code', e.target.value)}
                placeholder="Código..."
                className={styles.input}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldsRow}>
        {renderSpecificFields()}

        <div className={styles.fieldMini}>
          <label className={styles.label}>Cantidad</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={e => set('quantity', parseInt(e.target.value) || 1)}
            className={styles.input}
          />
        </div>

        <div className={styles.fieldMini}>
          <label className={styles.label}>Precio ({currency})</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.unit_price}
            onChange={e => set('unit_price', e.target.value)}
            placeholder="0.00"
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          className={styles.addBtn}
          disabled={addMutation.isPending}
          title="Agregar ítem"
        >
          {addMutation.isPending ? (
            <i className="bx bx-loader-alt bx-spin"></i>
          ) : (
            <i className="bx bx-plus"></i>
          )}
        </button>
      </div>
    </form>
  );
};