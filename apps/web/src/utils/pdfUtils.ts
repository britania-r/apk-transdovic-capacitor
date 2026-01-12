// File: apps/web/src/utils/pdfUtils.ts

import React from 'react'; // Importamos React para usar createElement
import ReactDOMServer from 'react-dom/server';
import { toast } from 'react-hot-toast';
import { getSupabase } from '@transdovic/shared';
import { PurchaseOrderPrint } from '../pages/purchases/PurchaseOrderPrint';

const fetchOrderDetailsForPrint = async (orderId: string) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_purchase_order_details', { p_order_id: orderId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontraron datos para la orden de compra.');
  return data;
};

export const handlePrintPurchaseOrder = async (orderId: string) => {
  const toastId = toast.loading('Generando PDF...');

  try {
    const details = await fetchOrderDetailsForPrint(orderId);

    // --- ESTA ES LA CORRECCIÓN CLAVE ---
    // En lugar de usar JSX (<Componente />), usamos React.createElement.
    // Esto nos permite mantener este archivo como un .ts puro.
    const printComponent = React.createElement(PurchaseOrderPrint, { details });
    const printHtml = ReactDOMServer.renderToStaticMarkup(printComponent);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('La ventana emergente fue bloqueada por el navegador.', { id: toastId });
      return;
    }

    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    toast.success('PDF listo para imprimir.', { id: toastId });
    
    setTimeout(() => {
      printWindow.print();
    }, 250);

  } catch (error: any) {
    console.error("Error al generar el PDF:", error);
    toast.error(`Error al generar PDF: ${error.message}`, { id: toastId });
  }
};