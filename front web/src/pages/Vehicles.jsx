// ══════════════════════════════════════════
// Vehicles.jsx
// ══════════════════════════════════════════
import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicle, patchVehicleLoc } from '../utils/api';

const LOCS = ['مكة','مدينة','جدة','في الطريق'];
const STS_CLS = {'متاح':'bg-green','مشغول':'bg-amber','صيانة':'bg-coral','خارج الخدمة':'bg-coral'};
const TYPE_CLS = {'باص':'bg-purple','كوستر':'bg-teal','هايس':'bg-gold','سيارة':'bg-gray'};

function VehicleModal({ vehicle, onClose, onSaved }) {
  const isEdit = !!vehicle;
  const [f, setF] = useState({
    plate_number: vehicle?.plate_number||'',
    vehicle_type: vehicle?.vehicle_type||'باص',
    capacity:     vehicle?.capacity||45,
    notes:        vehicle?.notes||'',
    status:       vehicle?.status||'متاح',
    current_location: vehicle?.current_location||'جدة',
  });
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState('');

  const save = async () => {
    if(!f.plate_number){setErr('رقم اللوحة مطلوب');return;}
    setSaving(true);setErr('');
    try {
      if(isEdit) await updateVehicle(vehicle.id,f);
      else       await createVehicle(f);
      onSaved();
    } catch(e){setErr(e.response?.data?.error||e.message);}
    finally{setSaving(false);}
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:460}}>
        <div className="modal-hdr">
          <span style={{fontWeight:700}}>{isEdit?'تعديل باص':'إضافة باص'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err&&<div className="err-box">{err}</div>}
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">رقم اللوحة *</label>
              <input type="text" placeholder="مثال: 2486SV" value={f.plate_number} onChange={e=>setF(p=>({...p,plate_number:e.target.value}))}/></div>
            <div className="fg"><label className="fl">نوع المركبة</label>
              <select value={f.vehicle_type} onChange={e=>setF(p=>({...p,vehicle_type:e.target.value}))}>
                {['باص','كوستر','هايس','سيارة'].map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="fg2" style={{marginBottom:10}}>
            <div className="fg"><label className="fl">السعة (راكب)</label>
              <input type="number" value={f.capacity} onChange={e=>setF(p=>({...p,capacity:e.target.value}))}/></div>
            <div className="fg"><label className="fl">الموقع الحالي</label>
              <select value={f.current_location} onChange={e=>setF(p=>({...p,current_location:e.target.value}))}>
                {LOCS.map(l=><option key={l}>{l}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">ملاحظات</label>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} style={{minHeight:50}}/></div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving?'جاري...':isEdit?'حفظ':'إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Vehicles() {
  const [vehicles,setVehicles]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);

  const load=()=>{setLoading(true);getVehicles().then(r=>setVehicles(r.data.data||[])).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div><div className="page-title">الباصات</div><div className="page-sub">{vehicles.length} مركبة</div></div>
        <button className="btn btn-primary" onClick={()=>setModal({type:'add'})}>+ إضافة باص</button>
      </div>
      <div className="page-body">
        <div className="stat-grid stat-grid-3" style={{marginBottom:16}}>
          {[
            {c:'teal', label:'متاحة',  val:vehicles.filter(v=>v.status==='متاح').length},
            {c:'amber',label:'مشغولة', val:vehicles.filter(v=>v.status==='مشغول').length},
            {c:'coral',label:'صيانة',  val:vehicles.filter(v=>v.status==='صيانة'||v.status==='خارج الخدمة').length},
          ].map(x=>(<div key={x.label} className={`stat-card ${x.c}`}><div className="s-label">{x.label}</div><div className="s-val">{x.val}</div></div>))}
        </div>
        <div className="card">
          <div className="table-wrap">
            {loading?<div className="loading">⏳ جاري التحميل...</div>
            :vehicles.length===0?<div className="empty">لا توجد مركبات</div>
            :<table>
              <thead><tr><th>رقم اللوحة</th><th>النوع</th><th>السعة</th><th>الموقع</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {vehicles.map(v=>(
                  <tr key={v.id}>
                    <td><span style={{fontFamily:'IBM Plex Mono',fontWeight:700,fontSize:14,color:'var(--gold)'}}>{v.plate_number}</span></td>
                    <td><span className={`badge ${TYPE_CLS[v.vehicle_type]||'bg-gray'}`}>{v.vehicle_type}</span></td>
                    <td style={{textAlign:'center'}}><span className="badge bg-gray">{v.capacity} راكب</span></td>
                    <td>
                      <select value={v.current_location}
                        onChange={async e=>{await patchVehicleLoc(v.id,e.target.value);load();}}
                        style={{fontSize:11,padding:'3px 6px',width:110}}>
                        {LOCS.map(l=><option key={l}>{l}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${STS_CLS[v.status]||'bg-gray'}`}>{v.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'edit',vehicle:v})}>تعديل</button></td>
                  </tr>
                ))}
              </tbody>
            </table>}
          </div>
        </div>
      </div>
      {modal?.type==='add'&&<VehicleModal onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal?.type==='edit'&&<VehicleModal vehicle={modal.vehicle} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
    </div>
  );
}
export default Vehicles;
