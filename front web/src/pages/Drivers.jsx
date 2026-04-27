import { useState, useEffect } from 'react';
import { getDrivers, getVehicles, createDriver, updateDriver, patchDriverLoc, addDriverPayment } from '../utils/api';

const LOCS = ['مكة','مدينة','جدة','في الطريق'];
const LOC_CLS = {'مكة':'bg-gold','مدينة':'bg-teal','جدة':'bg-purple','في الطريق':'bg-amber'};
const STS_CLS = {'متاح':'bg-green','مشغول':'bg-amber','خارج الخدمة':'bg-coral'};

function DriverModal({ driver, vehicles, onClose, onSaved }) {
  const isEdit = !!driver;
  const [f, setF] = useState({
    name:               driver?.name               || '',
    phone:              driver?.phone              || '',
    nationality:        driver?.nationality        || '',
    id_number:          driver?.id_number          || '',
    id_expiry:          driver?.id_expiry          || '',
    license_number:     driver?.license_number     || '',
    license_expiry:     driver?.license_expiry     || '',
    default_vehicle_id: driver?.default_vehicle_id || '',
    notes:              driver?.notes              || '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const save = async () => {
    if (!f.name || !f.phone) { setErr('الاسم والجوال مطلوبان'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { ...f, default_vehicle_id: f.default_vehicle_id || null };
      if (isEdit) await updateDriver(driver.id, payload);
      else        await createDriver(payload);
      onSaved();
    } catch(e) { setErr(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box fade-in">
        <div className="modal-hdr">
          <span style={{fontWeight:700,fontSize:14}}>{isEdit ? 'تعديل سائق' : 'إضافة سائق جديد'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="err-box">{err}</div>}
          <div className="sec-title">البيانات الأساسية</div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">الاسم *</label>
              <input type="text" placeholder="اسم الكابتن" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
            <div className="fg"><label className="fl">الجوال *</label>
              <input type="text" placeholder="05xxxxxxxx" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
          </div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">الجنسية</label>
              <input type="text" value={f.nationality} onChange={e=>setF(p=>({...p,nationality:e.target.value}))}/></div>
            <div className="fg"><label className="fl">الباص الافتراضي</label>
              <select value={f.default_vehicle_id} onChange={e=>setF(p=>({...p,default_vehicle_id:e.target.value}))}>
                <option value="">بدون باص افتراضي</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.plate_number} ({v.vehicle_type})</option>)}
              </select></div>
          </div>
          <div className="sec-title">بيانات الهوية</div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">رقم الهوية</label>
              <input type="text" value={f.id_number} onChange={e=>setF(p=>({...p,id_number:e.target.value}))}/></div>
            <div className="fg"><label className="fl">تاريخ انتهاء الهوية</label>
              <input type="date" value={f.id_expiry} onChange={e=>setF(p=>({...p,id_expiry:e.target.value}))}/></div>
          </div>
          <div className="sec-title">بيانات الرخصة</div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">رقم الرخصة</label>
              <input type="text" value={f.license_number} onChange={e=>setF(p=>({...p,license_number:e.target.value}))}/></div>
            <div className="fg"><label className="fl">تاريخ انتهاء الرخصة</label>
              <input type="date" value={f.license_expiry} onChange={e=>setF(p=>({...p,license_expiry:e.target.value}))}/></div>
          </div>
          <div className="fg"><label className="fl">ملاحظات</label>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} style={{minHeight:50}}/></div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'جاري...' : isEdit ? 'حفظ التعديلات' : 'إضافة السائق'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ driver, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('نقد');
  const [notes,  setNotes]  = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      await addDriverPayment(driver.id, { amount: parseFloat(amount), payment_method: method, notes });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:380}}>
        <div className="modal-hdr">
          <span style={{fontWeight:700}}>تسليم مبلغ — {driver.driver_name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{background:'var(--bg3)',borderRadius:10,padding:'12px 14px',marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>
            {[
              {l:'المكتسب',v:parseFloat(driver.total_earned||0).toFixed(0),c:'var(--teal)'},
              {l:'المدفوع', v:parseFloat(driver.total_paid||0).toFixed(0),  c:'var(--green)'},
              {l:'المتبقي', v:parseFloat(driver.balance_due||0).toFixed(0), c:'var(--coral)'},
            ].map(x=>(
              <div key={x.l}>
                <div style={{fontSize:9,color:'var(--text3)'}}>{x.l}</div>
                <div style={{fontFamily:'IBM Plex Mono',fontWeight:700,color:x.c,fontSize:16}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">المبلغ (ر.س)</label>
              <input type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
            <div className="fg"><label className="fl">طريقة الدفع</label>
              <select value={method} onChange={e=>setMethod(e.target.value)}>
                {['نقد','تحويل','شيك'].map(m=><option key={m}>{m}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">ملاحظة</label>
            <input type="text" placeholder="مثال: دفعة أسبوع 20 مارس" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving||!amount}>
            {saving ? 'جاري...' : '✓ تأكيد التسليم'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Drivers() {
  const [drivers,  setDrivers]  = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | {type:'add'|'edit'|'pay', driver?}
  const [search,   setSearch]   = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getDrivers(), getVehicles()])
      .then(([d,v]) => { setDrivers(d.data.data||[]); setVehicles(v.data.data||[]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = drivers.filter(d =>
    !search || (d.driver_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (d.phone||'').includes(search)
  );

  const totalDue = filtered.reduce((s,d) => s + parseFloat(d.balance_due||0), 0);

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div>
          <div className="page-title">السائقون</div>
          <div className="page-sub">{drivers.length} سائق مسجل</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({type:'add'})}>+ إضافة سائق</button>
      </div>
      <div className="page-body">
        <div className="stat-grid stat-grid-4" style={{marginBottom:16}}>
          {[
            {c:'teal',   label:'متاحون',        val:drivers.filter(d=>d.status==='متاح').length},
            {c:'amber',  label:'مشغولون',        val:drivers.filter(d=>d.status==='مشغول').length},
            {c:'gold',   label:'في مكة',         val:drivers.filter(d=>d.current_location==='مكة').length},
            {c:'coral',  label:'إجمالي المتبقي', val:totalDue.toFixed(0)+' ر.س'},
          ].map(x=>(
            <div key={x.label} className={`stat-card ${x.c}`}>
              <div className="s-label">{x.label}</div>
              <div className="s-val" style={{fontSize:x.c==='coral'?18:26}}>{x.val}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:10}}>
          <input type="text" placeholder="🔍 بحث بالاسم أو الجوال..." value={search}
            onChange={e=>setSearch(e.target.value)} style={{width:280}}/>
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? <div className="loading">⏳ جاري التحميل...</div>
            : filtered.length===0 ? <div className="empty">لا توجد سائقين</div>
            : <table>
                <thead>
                  <tr>
                    <th>الاسم</th><th>الجوال</th><th>رقم الهوية</th>
                    <th>انتهاء الرخصة</th><th>الباص الافتراضي</th>
                    <th>الموقع</th><th>الحالة</th>
                    <th>الرحلات</th><th>المكتسب</th><th>المدفوع</th><th>المتبقي</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const defVehicle = vehicles.find(v => v.id === d.default_vehicle_id);
                    const licExpiry = d.license_expiry ? new Date(d.license_expiry) : null;
                    const isExpired = licExpiry && licExpiry < new Date();
                    const isSoon    = licExpiry && !isExpired && (licExpiry - new Date()) < 30*24*60*60*1000;
                    return (
                      <tr key={d.id}>
                        <td style={{fontWeight:600,fontSize:12}}>{d.driver_name}</td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--text2)'}}>{d.phone}</td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--text3)'}}>{d.id_number||'—'}</td>
                        <td>
                          {d.license_expiry
                            ? <span style={{fontSize:10,color:isExpired?'var(--coral)':isSoon?'var(--amber)':'var(--text2)'}}>
                                {isExpired?'⚠ ':isSoon?'⏰ ':''}{d.license_expiry}
                              </span>
                            : <span style={{color:'var(--text3)'}}>—</span>}
                        </td>
                        <td>
                          {defVehicle
                            ? <span className="badge bg-gray">{defVehicle.plate_number}</span>
                            : <span style={{color:'var(--text3)',fontSize:11}}>—</span>}
                        </td>
                        <td>
                          <select value={d.current_location}
                            onChange={async e => { await patchDriverLoc(d.id, e.target.value); load(); }}
                            style={{fontSize:11,padding:'3px 6px',width:100}}>
                            {LOCS.map(l=><option key={l}>{l}</option>)}
                          </select>
                        </td>
                        <td><span className={`badge ${STS_CLS[d.status]||'bg-gray'}`}>{d.status}</span></td>
                        <td style={{textAlign:'center',color:'var(--text2)'}}>{d.total_trips}</td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--teal)'}}>{parseFloat(d.total_earned||0).toFixed(0)}</td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--green)'}}>{parseFloat(d.total_paid||0).toFixed(0)}</td>
                        <td>
                          <span style={{fontFamily:'IBM Plex Mono',fontWeight:700,fontSize:12,
                            color:parseFloat(d.balance_due)>0?'var(--coral)':'var(--green)'}}>
                            {parseFloat(d.balance_due||0).toFixed(0)} ر.س
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:5}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal({type:'edit',driver:d})}>تعديل</button>
                            <button className="btn btn-teal btn-sm"  onClick={() => setModal({type:'pay', driver:d})}>تسليم</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>}
          </div>
        </div>
      </div>

      {modal?.type === 'add' && (
        <DriverModal vehicles={vehicles} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'edit' && (
        <DriverModal driver={modal.driver} vehicles={vehicles} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'pay' && (
        <PaymentModal driver={modal.driver} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
    </div>
  );
}
