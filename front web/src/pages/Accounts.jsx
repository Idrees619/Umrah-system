import { useState, useEffect } from 'react';
import { getDrivers, getDriver, getSuppliers, getSupplier } from '../utils/api';

function DetailPanel({ type, id, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('trips');

  useEffect(() => {
    const fn = type === 'driver' ? getDriver : getSupplier;
    fn(id).then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, [type, id]);

  if (loading) return <div className="loading" style={{padding:20}}>⏳ تحميل...</div>;
  if (!data)   return null;

  const balance = data.balance || {};
  const trips   = data.trips   || [];
  const payments= data.payments|| [];

  return (
    <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontWeight:700,fontSize:13}}>{data.name||data.driver_name||data.supplier_name}</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>
      {/* رصيد */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,padding:'10px 14px'}}>
        {[
          {l:'المكتسب/المستحق',v:parseFloat(balance.total_earned||0).toFixed(0),c:'var(--teal)'},
          {l:'المدفوع',        v:parseFloat(balance.total_paid||0).toFixed(0),   c:'var(--green)'},
          {l:'المتبقي',        v:parseFloat(balance.balance_due||0).toFixed(0),  c:'var(--coral)'},
        ].map(x=>(
          <div key={x.l} style={{background:'var(--bg3)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
            <div style={{fontSize:9,color:'var(--text3)'}}>{x.l}</div>
            <div style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:x.c,fontSize:16}}>{x.v} ر.س</div>
          </div>
        ))}
      </div>
      {/* تبويبات */}
      <div style={{display:'flex',gap:6,padding:'0 14px 10px'}}>
        <button className={`btn btn-sm ${tab==='trips'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('trips')}>الرحلات ({trips.length})</button>
        <button className={`btn btn-sm ${tab==='pays'?'btn-primary':'btn-ghost'}`}  onClick={()=>setTab('pays')}>المدفوعات ({payments.length})</button>
      </div>
      <div style={{maxHeight:280,overflow:'auto',padding:'0 14px 14px'}}>
        {tab==='trips' && (
          trips.length===0 ? <div style={{fontSize:11,color:'var(--text3)'}}>لا توجد رحلات</div>
          : <table style={{fontSize:10}}>
              <thead><tr><th>التاريخ</th><th>النوع</th><th>من</th><th>إلى</th><th>المجموعة</th><th>التريب</th></tr></thead>
              <tbody>
                {trips.map(t=>(
                  <tr key={t.id}>
                    <td style={{fontFamily:'IBM Plex Mono',color:'var(--text3)'}}>{t.movement_date}</td>
                    <td><span className="badge bg-gray" style={{fontSize:8}}>{t.movement_type}</span></td>
                    <td>{t.from_city}</td><td>{t.to_city}</td>
                    <td style={{fontWeight:600}}>{t.group_name||'—'}</td>
                    <td style={{fontFamily:'IBM Plex Mono',color:'var(--gold)',fontWeight:700}}>{parseFloat(t.trip_amount||0).toFixed(0)} ر.س</td>
                  </tr>
                ))}
                <tr style={{background:'var(--bg3)',fontWeight:700}}>
                  <td colSpan={5} style={{textAlign:'left',paddingRight:8}}>الإجمالي</td>
                  <td style={{fontFamily:'IBM Plex Mono',color:'var(--teal)',fontWeight:700}}>
                    {trips.reduce((s,t)=>s+parseFloat(t.trip_amount||0),0).toFixed(0)} ر.س
                  </td>
                </tr>
              </tbody>
            </table>
        )}
        {tab==='pays' && (
          payments.length===0 ? <div style={{fontSize:11,color:'var(--text3)'}}>لا توجد مدفوعات</div>
          : <table style={{fontSize:10}}>
              <thead><tr><th>التاريخ</th><th>الطريقة</th><th>ملاحظة</th><th>المبلغ</th></tr></thead>
              <tbody>
                {payments.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontFamily:'IBM Plex Mono',color:'var(--text3)'}}>{p.payment_date}</td>
                    <td>{p.payment_method}</td>
                    <td style={{color:'var(--text2)'}}>{p.notes||p.reference_note||'—'}</td>
                    <td style={{fontFamily:'IBM Plex Mono',color:'var(--green)',fontWeight:700}}>{parseFloat(p.amount).toFixed(0)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}

export default function Accounts() {
  const [drivers,   setDrivers]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // {type, id}
  const [tab,       setTab]       = useState('drivers');

  useEffect(() => {
    setLoading(true);
    Promise.all([getDrivers(), getSuppliers()])
      .then(([d,s]) => { setDrivers(d.data.data||[]); setSuppliers(s.data.data||[]); })
      .finally(() => setLoading(false));
  }, []);

  const driverTotalEarned  = drivers.reduce((s,d)=>s+parseFloat(d.total_earned||0),0);
  const driverTotalPaid    = drivers.reduce((s,d)=>s+parseFloat(d.total_paid||0),0);
  const driverTotalDue     = drivers.reduce((s,d)=>s+parseFloat(d.balance_due||0),0);
  const supplierTotalEarned= suppliers.reduce((s,x)=>s+parseFloat(x.total_earned||0),0);
  const supplierTotalPaid  = suppliers.reduce((s,x)=>s+parseFloat(x.total_paid||0),0);
  const supplierTotalDue   = suppliers.reduce((s,x)=>s+parseFloat(x.balance_due||0),0);

  const openPrint = () => window.open('/print/accounts', '_blank');

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div><div className="page-title">الحسابات</div><div className="page-sub">السائقون والموردون</div></div>
        <button className="btn btn-print" onClick={openPrint}>🖨 طباعة كشف الحسابات</button>
      </div>
      <div className="page-body">
        {/* ملخص إجمالي */}
        <div className="stat-grid stat-grid-4" style={{marginBottom:16}}>
          {[
            {c:'teal',  label:'مستحقات السائقين',  val:driverTotalEarned.toFixed(0)+' ر.س'},
            {c:'coral', label:'متبقي السائقين',     val:driverTotalDue.toFixed(0)+' ر.س'},
            {c:'purple',label:'مستحقات الموردين',  val:supplierTotalEarned.toFixed(0)+' ر.س'},
            {c:'amber', label:'متبقي الموردين',     val:supplierTotalDue.toFixed(0)+' ر.س'},
          ].map(x=>(<div key={x.label} className={`stat-card ${x.c}`}><div className="s-label">{x.label}</div><div className="s-val" style={{fontSize:18}}>{x.val}</div></div>))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 1fr':'1fr',gap:14}}>
          <div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button className={`btn btn-sm ${tab==='drivers'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('drivers')}>السائقون ({drivers.length})</button>
              <button className={`btn btn-sm ${tab==='suppliers'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('suppliers')}>الموردون ({suppliers.length})</button>
            </div>

            {/* السائقون */}
            {tab==='drivers' && (
              <div className="card">
                <div className="table-wrap">
                  {loading?<div className="loading">⏳</div>:
                  <table>
                    <thead><tr><th>الاسم</th><th>الجوال</th><th>الرحلات</th><th>المكتسب</th><th>المدفوع</th><th>المتبقي</th><th></th></tr></thead>
                    <tbody>
                      {drivers.map(d=>(
                        <tr key={d.id} style={{cursor:'pointer',background:selected?.id===d.id?'rgba(201,168,76,.05)':''}}>
                          <td style={{fontWeight:600,fontSize:12}}>{d.driver_name}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text2)'}}>{d.phone}</td>
                          <td style={{textAlign:'center',color:'var(--text2)'}}>{d.total_trips}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--teal)'}}>{parseFloat(d.total_earned||0).toFixed(0)}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--green)'}}>{parseFloat(d.total_paid||0).toFixed(0)}</td>
                          <td><span style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:parseFloat(d.balance_due)>0?'var(--coral)':'var(--green)'}}>{parseFloat(d.balance_due||0).toFixed(0)} ر.س</span></td>
                          <td><button className="btn btn-ghost btn-sm" onClick={()=>setSelected(selected?.id===d.id?null:{type:'driver',id:d.id})}>تفاصيل</button></td>
                        </tr>
                      ))}
                      <tr style={{background:'var(--bg2)',fontWeight:700}}>
                        <td colSpan={3} style={{paddingRight:10}}>الإجمالي</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--teal)'}}>{driverTotalEarned.toFixed(0)}</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--green)'}}>{driverTotalPaid.toFixed(0)}</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--coral)',fontWeight:700}}>{driverTotalDue.toFixed(0)} ر.س</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>}
                </div>
              </div>
            )}

            {/* الموردون */}
            {tab==='suppliers' && (
              <div className="card">
                <div className="table-wrap">
                  {loading?<div className="loading">⏳</div>:
                  <table>
                    <thead><tr><th>الشركة</th><th>الجوال</th><th>الرحلات</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th></th></tr></thead>
                    <tbody>
                      {suppliers.map(s=>(
                        <tr key={s.id} style={{cursor:'pointer',background:selected?.id===s.id?'rgba(201,168,76,.05)':''}}>
                          <td style={{fontWeight:600,fontSize:12}}>{s.supplier_name}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text2)'}}>{s.phone||'—'}</td>
                          <td style={{textAlign:'center',color:'var(--text2)'}}>{s.total_trips}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--teal)'}}>{parseFloat(s.total_earned||0).toFixed(0)}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--green)'}}>{parseFloat(s.total_paid||0).toFixed(0)}</td>
                          <td><span style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:parseFloat(s.balance_due)>0?'var(--coral)':'var(--green)'}}>{parseFloat(s.balance_due||0).toFixed(0)} ر.س</span></td>
                          <td><button className="btn btn-ghost btn-sm" onClick={()=>setSelected(selected?.id===s.id?null:{type:'supplier',id:s.id})}>تفاصيل</button></td>
                        </tr>
                      ))}
                      <tr style={{background:'var(--bg2)',fontWeight:700}}>
                        <td colSpan={3} style={{paddingRight:10}}>الإجمالي</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--teal)'}}>{supplierTotalEarned.toFixed(0)}</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--green)'}}>{supplierTotalPaid.toFixed(0)}</td>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--coral)',fontWeight:700}}>{supplierTotalDue.toFixed(0)} ر.س</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>}
                </div>
              </div>
            )}
          </div>

          {selected && (
            <DetailPanel key={selected.id} type={selected.type} id={selected.id} onClose={()=>setSelected(null)}/>
          )}
        </div>
      </div>
    </div>
  );
}
