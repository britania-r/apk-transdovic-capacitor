import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import styles from './IngresoDetailPage.module.css';

import { InvoiceDetailFormModal } from './InvoiceDetailForm';
import { InvoiceDetailTable } from './InvoiceDetailTable';

// Tipos de datos
export interface IncomeMaster {
  id: string;
  income_date: string;
  amount: number;
  payment_type: string;
  description?: string;
  operation_number?: string;
  account_display: string;
}
export interface InvoiceDetail {
  id: string;
  amount: number;
  reference_number?: string;
  invoice_url?: string; // Puede ser opcional ahora
  user_name: string;
}
interface IncomeDetailsData {
  master: IncomeMaster;
  details: InvoiceDetail[];
}

const fetchIncomeDetails = async (id: string): Promise<IncomeDetailsData> => {
  const { data, error } = await getSupabase().rpc('get_income_details_list', { p_income_id: id });
  if (error) throw new Error(error.message);
  return data;
};

export const IngresoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  
  // Estado para manejar la edición
  const [selectedDetail, setSelectedDetail] = useState<InvoiceDetail | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['incomeDetails', id],
    queryFn: () => fetchIncomeDetails(id!),
    enabled: !!id,
  });

  // Funciones para abrir modales
  const handleOpenCreate = () => {
    setSelectedDetail(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (detail: InvoiceDetail) => {
    setSelectedDetail(detail);
    setFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormModalOpen(false);
    setSelectedDetail(null);
  };

  if (isLoading) return <p style={{ padding: '2rem' }}>Cargando detalles...</p>;
  if (isError) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>;
  if (!data?.master) return <p style={{ padding: '2rem' }}>Ingreso no encontrado.</p>;
  
  const { master, details } = data;

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Link to="/ingresos" className={styles.backLink}><i className='bx bx-arrow-back'></i> Volver a Ingresos</Link>
          <h1>Detalle de Ingreso Compuesto</h1>
        </header>

        {/* --- TARJETA DE DETALLES MAESTROS --- */}
        <div className={styles.detailsCard}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}><span className={styles.label}>Fecha de Ingreso</span><span className={styles.value}>{new Date(master.income_date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Monto Total</span><span className={styles.value}><strong>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(master.amount)}</strong></span></div>
            <div className={styles.detailItem}><span className={styles.label}>Cuenta Destino</span><span className={styles.value}>{master.account_display}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Tipo de Pago</span><span className={styles.value}>{master.payment_type}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>N° Operación</span><span className={styles.value}>{master.operation_number || 'N/A'}</span></div>
            <div className={`${styles.detailItem} ${styles.detailItemFull}`}><span className={styles.label}>Descripción</span><span className={styles.value}>{master.description || 'N/A'}</span></div>
          </div>
        </div>

        {/* --- SECCIÓN DE FACTURAS INDIVIDUALES --- */}
        <div className={styles.invoicesSection}>
          <div className={styles.invoicesHeader}>
            <h2>Facturas Individuales</h2>
            <button onClick={handleOpenCreate} className={styles.addButton}>
              <i className='bx bx-plus'></i> Añadir Factura
            </button>
          </div>
          {/* Pasamos la función de editar a la tabla */}
          <InvoiceDetailTable details={details} onEdit={handleOpenEdit} />
        </div>
      </div>
      
      {/* --- MODAL PARA AÑADIR/EDITAR FACTURAS --- */}
      <InvoiceDetailFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        detailToEdit={selectedDetail} // Pasamos el detalle a editar
      />
    </>
  );
};