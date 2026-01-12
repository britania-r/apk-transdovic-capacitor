// File: apps/web/src/pages/purchases/PurchaseOrderPrint.tsx

import type { PurchaseOrderDetails } from './PurchasesDetailsPage';

export const PurchaseOrderPrint = ({ details }: { details: PurchaseOrderDetails }) => {
  
  const styles = `
    @page { size: A4; margin: 1cm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: black; }
    .mainTable { width: 100%; border-collapse: collapse; border: 1px solid black; }
    .mainTable th, .mainTable td { border: 1px solid black; padding: 5px; vertical-align: top; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 5px; }
    .header h1 { font-size: 18pt; margin: 0; color: #c00000; font-weight: bold; }
    .logo { font-weight: bold; font-size: 14pt; }
    .codeBox { border: 1px solid black; font-size: 10pt; }
    .codeBox div { display: flex; justify-content: space-between; padding: 2px 4px; }
    .codeBox label { font-weight: bold; margin-right: 10px; }
    .section { padding: 8px; }
    .sectionTitle { background-color: #d9d9d9; font-weight: bold; padding: 2px; margin-bottom: 5px; text-align: center; }
    .section p { margin: 2px 0; }
    .itemsTable { width: 100%; border-collapse: collapse; }
    .itemsTable th, .itemsTable td { border: 1px solid black; padding: 4px; text-align: center; }
    .itemsTable th { font-weight: bold; background-color: #f2f2f2; }
    .itemsTable tbody td:nth-child(2) { text-align: left; }
    .itemsTable tfoot td { font-weight: bold; background-color: #f2f2f2; }
    .footerNotes { font-size: 8pt; padding: 10px; }
    .footerNotes p { margin: 2px 0; }
  `;

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <title>Orden de Compra - {details.order_code}</title>
        <style>{styles}</style>
      </head>
      <body>
        <div className="page">
          <table className="mainTable">
            <thead>
              <tr>
                <th colSpan={4}>
                  <header className="header">
                    <div className="logo">TRANSDOVIC</div>
                    <h1>ORDEN DE COMPRA</h1>
                    <div className="codeBox">
                      <div><label>Código:</label><span>{details.order_code}</span></div>
                      <div><label>Fecha:</label><span>{new Date(details.order_date).toLocaleDateString('es-PE')}</span></div>
                    </div>
                  </header>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="section">
                  <div className="sectionTitle">SEÑORES</div>
                  <p><strong>Proveedor:</strong> {details.supplier?.trade_name}</p>
                  <p><strong>RUC:</strong> {details.supplier?.ruc}</p>
                  <p><strong>Dirección:</strong> {details.supplier?.address || '-'}</p>
                </td>
                <td colSpan={2} className="section">
                  <div className="sectionTitle">CONDICIONES DE COMPRA</div>
                  <p><strong>Moneda:</strong> {details.currency === 'PEN' ? 'Soles (S/)' : 'Dólares ($)'}</p>
                  <p><strong>Condiciones de pago:</strong> {details.payment_condition} {details.payment_condition === 'Crédito' ? `(${details.credit_days} días)` : ''}</p>
                  <p><strong>N° Cuenta:</strong> {details.supplier_bank_account_id ? details.supplier?.bank_accounts?.find(acc => acc.id === details.supplier_bank_account_id)?.account_number : '-'}</p>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="section">
                  <div className="sectionTitle">DATOS PARA LA FACTURACIÓN</div>
                  <p><strong>Razón Social:</strong> EMPRESA DE TRANSPORTE DE CARGA Y SERVICIOS GENERALES DON VICTOR EIRL</p>
                  <p><strong>RUC:</strong> 20482836594</p>
                  <p><strong>Dirección:</strong> Urb. Las Flores del Golf Mz. A - Lte. 8 II Etapa - V.L.H. - Trujillo</p>
                </td>
                <td colSpan={2} className="section">
                  <div className="sectionTitle">DATOS PARA EL ENVÍO</div>
                   <p><strong>Recojo en tienda:</strong> {details.store_pickup ? 'Sí' : 'No'}</p>
                   <p><strong>Agencia:</strong> {details.shipping_agency || 'No aplica'}</p>
                </td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <table className="itemsTable">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio Unitario</th>
                        <th>Total (**)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.product_name || item.service_description || `Servicio para ${item.vehicle_plate}`}</td>
                          <td>{item.quantity}</td>
                          <td>Und.</td>
                          <td>{Number(item.unit_price).toFixed(2)}</td>
                          <td>{Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'right' }}><strong>Subtotal</strong></td>
                        <td><strong>{Number(details.subtotal).toFixed(2)}</strong></td>
                      </tr>
                      {details.has_igv && (
                        <>
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'right' }}><strong>IGV (18%)</strong></td>
                            <td><strong>{Number(details.igv_amount).toFixed(2)}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'right' }}><strong>Total Orden</strong></td>
                            <td><strong>{Number(details.total_amount).toFixed(2)}</strong></td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="footerNotes">
                  <p>*** Los precios {details.has_igv ? 'incluyen' : 'NO incluyen'} I.G.V.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
};