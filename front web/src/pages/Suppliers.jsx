import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, addSupplierPayment, addSupplierDriver, getSupplierDrivers } from '../utils/api';

function SupplierModal({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier;
  const [f,setF]=useState({name:supplier?.supplier_name||'',phone:supplier?.phone||'',country:supplier?.country||'',notes:''});
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!f.name)return;
    setSaving(true);
    try{ if(isEdit)await updateSupplier(supplier.id,f); else await createSupplier(f); onSaved(); }
    catch(e){alert(e.message);}finally{setSaving(false);}
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:400}}>
        <div className="modal-hdr"><span style={{fontWeight:700}}>{isEdit?'تعديل مورد':'إضافة مورد'}</span><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">اسم الشركة *</label><input type="text" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
            <div className="fg"><label className="fl">الجوال</label><input type="text" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
          </div>
          <div className="fg" style={{marginBottom:10}}><label className="fl">الدولة</label><input type="text" value={f.country} onChange={e=>setF(p=>({...p,country:e.target.value}))}/></div>
          <div className="fg"><label className="fl">ملاحظات</label><textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} style={{minHeight:50}}/></div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'جاري...':isEdit?'حفظ':'إضافة'}</button>
        </div>
      </div>
    </div>
  );
}

function SupplierDetail({ supplier, onClose, onSaved }) {
  const [drivers,  setDrivers]  = useState([]);
  const [payAmt,   setPayAmt]   = useState('');
  const [payNote,  setPayNote]  = useState('');
  const [newDrv,   setNewDrv]   = useState({name:'',phone:'',plate_number:'',vehicle_type:'باص'});
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState('pay'); // 'pay' | 'drivers'

  useEffect(() => {
    if (supplier) getSupplierDrivers(supplier.id).then(r => setDrivers(r.data.data||[]));
  }, [supplier]);

  const savePay = async () => {
    if (!payAmt) return;
    setSaving(true);
    try { await addSupplierPayment(supplier.id, { amount: parseFloat(payAmt), notes: payNote }); setPayAmt(''); setPayNote(''); onSaved(); }
    catch(e){ alert(e.message); } finally { setSaving(false); }
  };

  const saveDrv = async () => {
    if (!newDrv.name) return;
    setSaving(true);
    try { await addSupplierDriver(supplier.id, newDrv); setNewDrv({name:'',phone:'',plate_number:'',vehicle_type:'باص'}); getSupplierDrivers(supplier.id).then(r=>setDrivers(r.data.data||[])); }
    catch(e){ alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:560}}>
        <div className="modal-hdr">
          <span style={{fontWeight:700}}>{supplier.supplier_name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* رصيد */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            {[
              {l:'المستحق',v:parseFloat(supplier.total_earned||0).toFixed(0),c:'var(--teal)'},
              {l:'المدفوع', v:parseFloat(supplier.total_paid||0).toFixed(0),  c:'var(--green)'},
              {l:'المتبقي', v:parseFloat(supplier.balance_due||0).toFixed(0), c:'var(--coral)'},
            ].map(x=>(
              <div key={x.l} style={{background:'var(--bg3)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:9,color:'var(--text3)'}}>{x.l}</div>
                <div style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:x.c,fontSize:18}}>{x.v} ر.س</div>
              </div>
            ))}
          </div>
          {/* تبويبات */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <button className={`btn btn-sm ${tab==='pay'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('pay')}>تسليم مبلغ</button>
            <button className={`btn btn-sm ${tab==='drivers'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('drivers')}>السائقون الخارجيون ({drivers.length})</button>
          </div>
          {tab==='pay' && (
            <div>
              <div className="fg2" style={{marginBottom:10}}>
                <div className="fg"><label className="fl">المبلغ (ر.س)</label><input type="number" placeholder="0" value={payAmt} onChange={e=>setPayAmt(e.target.value)}/></div>
                <div className="fg"><label className="fl">ملاحظة</label><input type="text" value={payNote} onChange={e=>setPayNote(e.target.value)}/></div>
              </div>
              <button className="btn btn-primary" onClick={savePay} disabled={saving||!payAmt}>{saving?'جاري...':'✓ تأكيد'}</button>
            </div>
          )}
          {tab==='drivers' && (
            <div>
              <div style={{marginBottom:10}}>
                {drivers.length===0 ? <div style={{fontSize:11,color:'var(--text3)'}}>لا يوجد سائقون خارجيون بعد</div>
                : <table style={{fontSize:11,marginBottom:10}}>
                    <thead><tr><th>الاسم</th><th>الجوال</th><th>اللوحة</th><th>النوع</th></tr></thead>
                    <tbody>
                      {drivers.map(d=>(
                        <tr key={d.id}>
                          <td style={{fontWeight:600}}>{d.name}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:10}}>{d.phone||'—'}</td>
                          <td>{d.plate_number?<span className="badge bg-gray">{d.plate_number}</span>:'—'}</td>
                          <td>{d.vehicle_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
              </div>
              <div className="sec-title">إضافة سائق خارجي</div>
              <div className="fg4" style={{marginBottom:10}}>
                <div className="fg"><label className="fl">الاسم *</label><input type="text" value={newDrv.name} onChange={e=>setNewDrv(p=>({...p,name:e.target.value}))}/></div>
                <div className="fg"><label className="fl">الجوال</label><input type="text" value={newDrv.phone} onChange={e=>setNewDrv(p=>({...p,phone:e.target.value}))}/></div>
                <div className="fg"><label className="fl">اللوحة</label><input type="text" value={newDrv.plate_number} onChange={e=>setNewDrv(p=>({...p,plate_number:e.target.value}))}/></div>
                <div className="fg"><label className="fl">النوع</label>
                  <select value={newDrv.vehicle_type} onChange={e=>setNewDrv(p=>({...p,vehicle_type:e.target.value}))}>
                    {['باص','كوستر','هايس','سيارة'].map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={saveDrv} disabled={saving||!newDrv.name}>{saving?'جاري...':'+ إضافة'}</button>
            </div>
          )}
        </div>
        <div className="modal-ftr"><button className="btn btn-ghost" onClick={onClose}>إغلاق</button></div>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [suppliers,setSuppliers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);

  const load=()=>{setLoading(true);getSuppliers().then(r=>setSuppliers(r.data.data||[])).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);

  const totalDue = suppliers.reduce((s,x)=>s+parseFloat(x.balance_due||0),0);

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div><div className="page-title">الموردون</div><div className="page-sub">{suppliers.length} مورد</div></div>
        <button className="btn btn-primary" onClick={()=>setModal({type:'add'})}>+ إضافة مورد</button>
      </div>
      <div className="page-body">
        <div className="stat-grid stat-grid-3" style={{marginBottom:16}}>
          {[
            {c:'gold', label:'عدد الموردين',      val:suppliers.length},
            {c:'teal', label:'إجمالي المستحق',    val:suppliers.reduce((s,x)=>s+parseFloat(x.total_earned||0),0).toFixed(0)+' ر.س'},
            {c:'coral',label:'إجمالي المتبقي',    val:totalDue.toFixed(0)+' ر.س'},
          ].map(x=>(<div key={x.label} className={`stat-card ${x.c}`}><div className="s-label">{x.label}</div><div className="s-val" style={{fontSize:18}}>{x.val}</div></div>))}
        </div>
        <div className="card">
          <div className="table-wrap">
            {loading?<div className="loading">⏳ جاري التحميل...</div>
            :suppliers.length===0?<div className="empty">لا يوجد موردون</div>
            :<table>
              <thead><tr><th>اسم الشركة</th><th>الجوال</th><th>الدولة</th><th>الرحلات</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th></th></tr></thead>
              <tbody>
                {suppliers.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontWeight:600,fontSize:12}}>{s.supplier_name}</td>
                    <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--text2)'}}>{s.phone||'—'}</td>
                    <td style={{fontSize:11}}>{s.country||'—'}</td>
                    <td style={{textAlign:'center'}}><span className="badge bg-gray">{s.total_trips}</span></td>
                    <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--teal)'}}>{parseFloat(s.total_earned||0).toFixed(0)}</td>
                    <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--green)'}}>{parseFloat(s.total_paid||0).toFixed(0)}</td>
                    <td><span style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:parseFloat(s.balance_due)>0?'var(--coral)':'var(--green)'}}>{parseFloat(s.balance_due||0).toFixed(0)} ر.س</span></td>
                    <td>
                      <div style={{display:'flex',gap:5}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'edit',supplier:s})}>تعديل</button>
                        <button className="btn btn-teal btn-sm"  onClick={()=>setModal({type:'detail',supplier:s})}>تفاصيل</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
          </div>
        </div>
      </div>
      {modal?.type==='add'    && <SupplierModal onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal?.type==='edit'   && <SupplierModal supplier={modal.supplier} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal?.type==='detail' && <SupplierDetail supplier={modal.supplier} onClose={()=>setModal(null)} onSaved={()=>{load();}}/>}
    </div>
  );
}
