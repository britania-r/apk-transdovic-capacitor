import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { toast } from 'react-hot-toast';
import { OperationDetailFormModal } from './OperationDetailFormModal';
import styles from '../users/UsersPage.module.css'; 
import tableStyles from '../users/UserTable.module.css';

interface DetailItem {
    id: string;
    document_number: string;
    amount: number;
    voucher_url?: string;
}

interface OperationData {
    id: string;
    operation_type: string;
    operation_date: string;
    amount: number; 
    currency: string;
    detail?: string; 
    operation_number?: string; 
    
    account?: { 
        id: string;
        bank_name: string; // Nombre traído de tabla banks
        currency: string; 
        account_number: string; 
    };
    
    operation_details?: DetailItem[];
}

export const OperationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<OperationData>({
    queryKey: ['operation', id],
    queryFn: async () => {
      const supabase = getSupabase();

      // PASO 1: Operación
      const { data: opData, error: opError } = await supabase
        .from('operations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (opError) throw opError;

      // PASO 2: Cuenta Bancaria
      let accountInfo = null;
      if (opData.account_id) {
          const { data: accData, error: accError } = await supabase
            .from('company_bank_accounts') 
            .select('*') // Traemos todo para evitar errores de columna
            .eq('id', opData.account_id)
            .single();
          
          if (!accError && accData) {
             // PASO 2.5: Nombre del Banco (Si hay bank_id)
             let bankName = 'Banco desconocido';
             if (accData.bank_id) {
                 const { data: bankData } = await supabase
                    .from('banks')
                    .select('name')
                    .eq('id', accData.bank_id)
                    .single();
                 if (bankData) bankName = bankData.name;
             }

             accountInfo = {
                 id: accData.id,
                 bank_name: bankName,
                 currency: accData.currency,
                 account_number: accData.account_number
             };
          }
      }

      // PASO 3: Detalles
      const { data: detailsData, error: detError } = await supabase
        .from('operation_details')
        .select('*')
        .eq('operation_id', id);

      if (detError) throw detError;

      return {
        ...opData,
        account: accountInfo,
        operation_details: detailsData || []
      } as OperationData;
    },
    enabled: !!id
  });

  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: string) => {
        const { error } = await getSupabase().rpc('delete_operation_detail', { p_detail_id: detailId } as any);
        if(error) throw error;
    },
    onSuccess: () => {
        toast.success('Detalle eliminado');
        queryClient.invalidateQueries({ queryKey: ['operation', id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) return <div className={styles.pageContainer}><p>Cargando detalles...</p></div>;
  if (error || !data) return <div className={styles.pageContainer}><p>Error: Operación no encontrada</p></div>;

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: data.currency }).format(amount);

  const details = data.operation_details || [];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <Link to="/operaciones" className={styles.addButton} style={{background:'#6b7280', textDecoration:'none', padding:'8px 16px'}}>
                <i className='bx bx-arrow-back'></i> Volver
            </Link>
            <div>
                <h1 style={{margin:0}}>Detalle de Operación</h1>
                <small style={{color:'#666'}}>{data.operation_number ? `Voucher Global: ${data.operation_number}` : 'Sin voucher global'}</small>
            </div>
        </div>
        <button onClick={() => navigate('/operaciones')} className={styles.addButton} style={{backgroundColor:'#10b981'}}>
            <i className='bx bx-check'></i> Finalizar Carga
        </button>
      </header>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div>
            <label style={{fontWeight:'bold', color:'#666', display:'block', fontSize:'0.75rem'}}>TIPO</label>
            <span className={styles.badge}>{data.operation_type}</span>
        </div>
        <div>
            <label style={{fontWeight:'bold', color:'#666', display:'block', fontSize:'0.75rem'}}>FECHA</label>
            <span style={{fontWeight:500}}>{data.operation_date}</span>
        </div>
        <div>
            <label style={{fontWeight:'bold', color:'#666', display:'block', fontSize:'0.75rem'}}>CUENTA</label>
            <span>{data.account ? `${data.account.bank_name} - ${data.account.account_number}` : 'Cuenta no encontrada'}</span>
        </div>
        <div>
            <label style={{fontWeight:'bold', color:'#666', display:'block', fontSize:'0.75rem'}}>MONTO TOTAL</label>
            <span style={{fontSize:'1.5rem', fontWeight:'bold', color: data.amount > 0 ? '#2563eb' : '#9ca3af'}}>
                {formatMoney(data.amount)}
            </span>
        </div>
        <div style={{gridColumn:'1/-1', borderTop:'1px solid #eee', paddingTop:'10px'}}>
            <label style={{fontWeight:'bold', color:'#666', display:'block', fontSize:'0.75rem'}}>DETALLE GLOBAL</label>
            <span style={{fontStyle:'italic', color:'#374151'}}>{data.detail || '-'}</span>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
        <h3 style={{margin:0}}>Items / Facturas ({details.length})</h3>
        <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
            <i className='bx bx-plus'></i> Agregar Item
        </button>
      </div>

      <div className={tableStyles.tableWrapper}>
        <table className={tableStyles.table}>
            <thead>
                <tr>
                    <th>N° Documento</th>
                    <th>Monto</th>
                    <th>Archivo</th>
                    <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {details.map((d) => (
                    <tr key={d.id}>
                        <td>{d.document_number || '-'}</td>
                        <td style={{fontWeight:'bold'}}>{formatMoney(d.amount)}</td>
                        <td>
                            {d.voucher_url ? (
                                <a href={d.voucher_url} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>Ver PDF</a>
                            ) : '-'}
                        </td>
                        <td style={{textAlign:'right'}}>
                            <button onClick={() => deleteDetailMutation.mutate(d.id)} className={`${tableStyles.actionButton} ${tableStyles.deleteButton}`}>
                                <i className='bx bx-trash'></i>
                            </button>
                        </td>
                    </tr>
                ))}
                {details.length === 0 && (
                    <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem', color:'#999'}}>No hay facturas cargadas.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {id && <OperationDetailFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} operationId={id} />}
    </div>
  );
};