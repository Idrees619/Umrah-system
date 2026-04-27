import { useState, useEffect, useCallback } from 'react';
import { getMovements, patchStatus, getDriverList, getVehicles, getSupplierList, getSupplierDrivers, updateMovement, addDriverTrip, addSupplierTrip } from '../utils/api';

const TCLS = {'وصول':'bg-teal','تنقل':'bg-purple','مزارات':'bg-amber','مغادرة':'bg-coral'};
const TROW = {'وصول':'row-arrival','تنقل':'row-transfer','مزارات':'row-visit','مغادرة':'row-departure'};
const TCLR = {'وصول':'var(--teal)','تنقل':'var(--purple)','مزارات':'var(--amber)','مغادرة':'var(--coral)'};
const SCSS = {'مجدول':'bg-gray','جاري':'bg-teal','منتهي':'bg-green','ملغي':'bg-coral','تحتاج-مراجعة':'bg-amber'};
const STATUSES = ['مجدول','جاري','منتهي','ملغي','تحتاج-مراجعة'];
const CITIES = ['مكة','مدينة','جدة','مطار-جدة','مطار-مدينة','أخرى'];

function CF({val,onChange,opts,ph}) {
  if(opts) return <select className="col-filter" value={val} onChange={e=>onChange(e.target.value)}>
    <option value="">الكل</option>{opts.map(o=><option key={o}>{o}</option>)}</select>;
  return <input className="col-filter" value={val} onChange={e=>onChange(e.target.value)} placeholder={ph||'🔍'}/>;
}

function AssignPanel({m, drivers, vehicles, onClose, onSaved}) {
  const [dType,    setDType]    = useState(m.driver_type||'internal');
  const [driverId, setDriverId] = useState(m.driver_id||'');
  const [vehicleId,setVehicleId]= useState(m.vehicle_id||'');
  const [suppId,   setSuppId]   = useState(m.supplier_id||'');
  const [suppDrivers,setSuppDrivers] = useState([]);
  const [extDrvId, setExtDrvId] = useState('');
  const [extName,  setExtName]  = useState(m.ext_driver_name||'');
  const [extPhone, setExtPhone] = useState(m.ext_driver_phone||'');
  const [extPlate, setExtPlate] = useState(m.ext_plate_number||'');
  const [suppliers,setSuppliers]= useState([]);
  const [tripAmt,  setTripAmt]  = useState('');
  const [notes,    setNotes]    = useState(m.notes||'');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    getSupplierList().then(r=>setSuppliers(r.data.data||[]));
  },[]);

  useEffect(()=>{
    if(suppId) getSupplierDrivers(suppId).then(r=>setSuppDrivers(r.data.data||[]));
  },[suppId]);

  const pickDriver = (id) => {
    setDriverId(id);
    const d = drivers.find(x=>x.id===id);
    if(d?.default_vehicle_id) setVehicleId(d.default_vehicle_id);
  };

  const pickExtDrv = (id) => {
    setExtDrvId(id);
    const d = suppDrivers.find(x=>x.id===id);
    if(d){ setExtName(d.name); setExtPhone(d.phone||''); setExtPlate(d.plate_number||''); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        driver_type: dType,
        driver_id:   dType==='internal'?(driverId||null):null,
        vehicle_id:  dType==='internal'?(vehicleId||null):null,
        supplier_id: dType==='external'?(suppId||null):null,
        ext_driver_id: dType==='external'?(extDrvId||null):null,
        ext_driver_name:  dType==='external'?extName:null,
        ext_driver_phone: dType==='external'?extPhone:null,
        ext_plate_number: dType==='external'?extPlate:null,
        notes,
      };
      await updateMovement(m.id, body);
      if(tripAmt && parseFloat(tripAmt)>0) {
        if(dType==='internal' && driverId)
          await addDriverTrip(driverId,{movement_id:m.id,booking_id:m.booking_id,trip_amount:parseFloat(tripAmt)});
        if(dType==='external' && suppId)
          await addSupplierTrip(suppId,{movement_id:m.id,booking_id:m.booking_id,trip_amount:parseFloat(tripAmt)});
      }
      onSaved();
    } catch(e){ alert('خطأ: '+e.message); }
    finally{ setSaving(false); }
  };

  return (
    <div style={{background:'var(--bg)',border:'1px solid var(--gold-dim)',borderRadius:'var(--r-lg)',padding:14,margin:'2px 0'}}>
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <span style={{fontSize:11,color:'var(--text3)',fontWeight:600}}>نوع السائق:</span>
        <button className={`btn btn-sm ${dType==='internal'?'btn-primary':'btn-ghost'}`} onClick={()=>setDType('internal')}>من الشركة</button>
        <button className={`btn btn-sm ${dType==='external'?'btn-primary':'btn-ghost'}`} onClick={()=>setDType('external')}>مورد خارجي</button>
        <button className="btn btn-ghost btn-sm" style={{marginRight:'auto'}} onClick={onClose}>✕ إغلاق</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:10,alignItems:'end'}}>
        {dType==='internal' ? (<>
          <div className="fg">
            <label className="fl">الكابتن</label>
            <select value={driverId} onChange={e=>pickDriver(e.target.value)}>
              <option value="">اختر الكابتن</option>
              {drivers.map(d=><option key={d.id} value={d.id}>{d.name} ({d.current_location})</option>)}
            </select>
            {driverId && (<div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>
              📞 {drivers.find(d=>d.id===driverId)?.phone} | 🪪 {drivers.find(d=>d.id===driverId)?.id_number}
            </div>)}
          </div>
          <div className="fg">
            <label className="fl">الباص / اللوحة</label>
            <select value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>
              <option value="">اختر الباص</option>
              {vehicles.map(v=><option key={v.id} value={v.id}>{v.plate_number} ({v.vehicle_type} — {v.capacity})</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">مبلغ التريب (ر.س)</label>
            <input type="number" placeholder="0" value={tripAmt} onChange={e=>setTripAmt(e.target.value)}/>
          </div>
        </>) : (<>
          <div className="fg">
            <label className="fl">شركة النقل</label>
            <select value={suppId} onChange={e=>setSuppId(e.target.value)}>
              <option value="">اختر المورد</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">الكابتن الخارجي</label>
            {suppDrivers.length>0
              ? <select onChange={e=>pickExtDrv(e.target.value)}>
                  <option value="">اختر سائق</option>
                  {suppDrivers.map(d=><option key={d.id} value={d.id}>{d.name} — {d.plate_number}</option>)}
                </select>
              : <input type="text" placeholder="اسم الكابتن" value={extName} onChange={e=>setExtName(e.target.value)}/>}
          </div>
          <div className="fg">
            <label className="fl">جوال الكابتن</label>
            <input type="text" placeholder="05xxxxxxxx" value={extPhone} onChange={e=>setExtPhone(e.target.value)}/>
          </div>
          <div className="fg">
            <label className="fl">رقم اللوحة</label>
            <input type="text" placeholder="اللوحة" value={extPlate} onChange={e=>setExtPlate(e.target.value)}/>
          </div>
          <div className="fg">
            <label className="fl">سعر النقل الخارجي (ر.س)</label>
            <input type="number" placeholder="0" value={tripAmt} onChange={e=>setTripAmt(e.target.value)}/>
          </div>
        </>)}
        <div className="fg">
          <label className="fl">ملاحظات</label>
          <input type="text" placeholder="ملاحظة" value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>
      </div>
      <div style={{marginTop:10,display:'flex',gap:8}}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'جاري الحفظ...':'✓ حفظ التعيين'}</button>
      </div>
    </div>
  );
}

export default function Schedule() {
  const today = new Date().toISOString().split('T')[0];
  const [params,  setParams]  = useState({ date: today });
  const [multiDay,setMultiDay]= useState(false);
  const [dFrom,   setDFrom]   = useState(today);
  const [dTo,     setDTo]     = useState(today);
  const [rows,    setRows]    = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles,setVehicles]= useState([]);
  const [loading, setLoading] = useState(true);
  const [assignId,setAssignId]= useState(null);

  // فلاتر الأعمدة
  const [f, setF] = useState({time:'',type:'',group:'',company:'',nat:'',from:'',to:'',driver:'',plate:'',flight:'',status:'',dType:''});
  const setFld = (k,v) => setF(p=>({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = multiDay ? { date_from:dFrom, date_to:dTo } : { date: params.date };
      const r = await getMovements(p);
      setRows(r.data.data||[]);
    } finally { setLoading(false); }
  },[params.date, dFrom, dTo, multiDay]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ getDriverList().then(r=>setDrivers(r.data.data||[])); getVehicles().then(r=>setVehicles(r.data.data||[])); },[]);

  const filtered = rows.filter(m=>{
    if(f.time    && !(m.movement_time||'').includes(f.time))     return false;
    if(f.type    && m.movement_type!==f.type)                    return false;
    if(f.group   && !(m.group_name||'').toLowerCase().includes(f.group.toLowerCase())) return false;
    if(f.company && !(m.company_name||'').toLowerCase().includes(f.company.toLowerCase())) return false;
    if(f.nat     && !(m.nationality||'').toLowerCase().includes(f.nat.toLowerCase())) return false;
    if(f.from    && !(m.from_location||m.from_city||'').toLowerCase().includes(f.from.toLowerCase())) return false;
    if(f.to      && !(m.to_location||m.to_city||'').toLowerCase().includes(f.to.toLowerCase())) return false;
    if(f.driver  && !((m.driver_name||m.ext_driver_name||'')).toLowerCase().includes(f.driver.toLowerCase())) return false;
    if(f.plate   && !((m.plate_number||m.ext_plate_number||'')).includes(f.plate)) return false;
    if(f.flight  && !(m.flight_number||'').includes(f.flight)) return false;
    if(f.status  && m.status!==f.status)                         return false;
    if(f.dType   && (m.driver_type||'internal')!==f.dType)       return false;
    return true;
  });

  const hasFilter = Object.values(f).some(Boolean);
  const changeDay = d => { const dt=new Date(params.date); dt.setDate(dt.getDate()+d); setParams({date:dt.toISOString().split('T')[0]}); };

  const handlePrint = () => {
    const qs = new URLSearchParams();
    if(multiDay){ qs.set('date_from',dFrom); qs.set('date_to',dTo); }
    else qs.set('date',params.date);
    if(f.type)   qs.set('type',f.type);
    if(f.nat)    qs.set('nationality',f.nat);
    if(f.company)qs.set('company',f.company);
    if(f.dType)  qs.set('driver_type',f.dType);
    window.open(`/print/schedule?${qs.toString()}`, '_blank');
  };

  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div className="page-hdr">
        <div>
          <div className="page-title">جدول التحركات</div>
          <div className="page-sub">
            {filtered.length} حركة
            {hasFilter && <span style={{color:'var(--gold)',marginRight:8}}>● مفلتر</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button className={`btn btn-sm ${!multiDay?'btn-primary':'btn-ghost'}`} onClick={()=>setMultiDay(false)}>يوم</button>
          <button className={`btn btn-sm ${multiDay?'btn-primary':'btn-ghost'}`}  onClick={()=>setMultiDay(true)}>فترة</button>
          {!multiDay
            ? <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>changeDay(-1)}>‹</button>
                <input type="date" value={params.date} onChange={e=>setParams({date:e.target.value})} style={{width:140}}/>
                <button className="btn btn-ghost btn-sm" onClick={()=>changeDay(1)}>›</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setParams({date:today})}>اليوم</button>
              </div>
            : <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <input type="date" value={dFrom} onChange={e=>setDFrom(e.target.value)} style={{width:130}}/>
                <span style={{color:'var(--text3)'}}>—</span>
                <input type="date" value={dTo}   onChange={e=>setDTo(e.target.value)}   style={{width:130}}/>
              </div>}
          {hasFilter && <button className="btn btn-ghost btn-sm" style={{color:'var(--coral)'}} onClick={()=>setF({time:'',type:'',group:'',company:'',nat:'',from:'',to:'',driver:'',plate:'',flight:'',status:'',dType:''})}>✕ مسح</button>}
          <button className="btn btn-print btn-sm" onClick={handlePrint}>🖨 طباعة</button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{padding:'0 24px 10px',display:'flex',gap:8,flexShrink:0,flexWrap:'wrap'}}>
        {[
          {l:'الكل',   v:filtered.length,                                            c:'var(--gold)'},
          {l:'وصول',   v:filtered.filter(r=>r.movement_type==='وصول').length,        c:'var(--teal)'},
          {l:'تنقل',   v:filtered.filter(r=>r.movement_type==='تنقل').length,        c:'var(--purple)'},
          {l:'مزارات', v:filtered.filter(r=>r.movement_type==='مزارات').length,      c:'var(--amber)'},
          {l:'مغادرة', v:filtered.filter(r=>r.movement_type==='مغادرة').length,      c:'var(--coral)'},
          {l:'خارجي',  v:filtered.filter(r=>r.driver_type==='external').length,      c:'var(--text2)'},
          {l:'بلا سائق',v:filtered.filter(r=>!r.driver_name&&!r.ext_driver_name).length, c:'var(--coral)'},
        ].map(x=>(
          <div key={x.l} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 12px',display:'flex',gap:7,alignItems:'center'}}>
            <span style={{fontSize:17,fontWeight:700,color:x.c}}>{x.v}</span>
            <span style={{fontSize:10,color:'var(--text3)'}}>{x.l}</span>
          </div>
        ))}
      </div>

      {/* الجدول */}
      <div style={{flex:1,overflow:'auto',padding:'0 24px 24px'}}>
        <div className="card" style={{minWidth:1500}}>
          <table>
            <thead>
              <tr>
                {['الوقت','التاريخ','النوع','المجموعة','الشركة/الوكيل','الجنسية','عدد','من (فندق)','إلى (فندق)','رحلة','الكابتن','جوال','اللوحة','داخلي/خارجي','الحالة','تعيين'].map((h,i)=>(
                  <th key={i} style={{minWidth: i===3?140:i===7||i===8?130:i===4?120:i===10?110:i===9?70:undefined}}>{h}</th>
                ))}
              </tr>
              <tr style={{background:'var(--bg3)'}}>
                <th><CF val={f.time}   onChange={v=>setFld('time',v)}    ph="وقت"/></th>
                <th></th>
                <th><CF val={f.type}   onChange={v=>setFld('type',v)}    opts={['وصول','تنقل','مزارات','مغادرة']}/></th>
                <th><CF val={f.group}  onChange={v=>setFld('group',v)}   ph="المجموعة"/></th>
                <th><CF val={f.company}onChange={v=>setFld('company',v)} ph="الشركة"/></th>
                <th><CF val={f.nat}    onChange={v=>setFld('nat',v)}     ph="جنسية"/></th>
                <th></th>
                <th><CF val={f.from}   onChange={v=>setFld('from',v)}   ph="من"/></th>
                <th><CF val={f.to}     onChange={v=>setFld('to',v)}     ph="إلى"/></th>
                <th><CF val={f.flight} onChange={v=>setFld('flight',v)} ph="رحلة"/></th>
                <th><CF val={f.driver} onChange={v=>setFld('driver',v)} ph="كابتن"/></th>
                <th></th>
                <th><CF val={f.plate}  onChange={v=>setFld('plate',v)}  ph="لوحة"/></th>
                <th><CF val={f.dType}  onChange={v=>setFld('dType',v)}  opts={['internal','external']}/></th>
                <th><CF val={f.status} onChange={v=>setFld('status',v)} opts={['مجدول','جاري','منتهي','ملغي','تحتاج-مراجعة']}/></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={16}><div className="loading">⏳ جاري التحميل...</div></td></tr>
                : filtered.length===0
                  ? <tr><td colSpan={16}><div className="empty">لا توجد نتائج{hasFilter?' — جرّب مسح الفلاتر':''}</div></td></tr>
                  : filtered.map(m=>{
                    const isExt = (m.driver_type||'internal')==='external';
                    const isOpen = assignId===m.id;
                    return [
                      <tr key={m.id} className={TROW[m.movement_type]||''} style={{background:isOpen?'rgba(201,168,76,.04)':''}}>
                        <td><span style={{fontFamily:'IBM Plex Mono',color:'var(--gold)',fontWeight:700,fontSize:13}}>{m.movement_time?.slice(0,5)}</span></td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text3)',whiteSpace:'nowrap'}}>{m.movement_date}</td>
                        <td><span className={`badge ${TCLS[m.movement_type]||'bg-gray'}`}><span className="dot" style={{background:TCLR[m.movement_type]}}/>{m.movement_type}</span></td>
                        <td><div style={{fontWeight:600,fontSize:12}}>{m.guest_name||m.group_name||'—'}</div><div style={{fontSize:9,color:'var(--text3)'}}>#{m.booking_number} · {m.passenger_count} فرد</div></td>
                        <td style={{fontSize:11}}><div>{m.company_name||'—'}</div>{m.agent_name&&<div style={{fontSize:9,color:'var(--text3)'}}>{m.agent_name} {m.agent_phone}</div>}</td>
                        <td><span className="badge bg-gray" style={{fontSize:9}}>{m.nationality||'—'}</span></td>
                        <td style={{textAlign:'center',fontWeight:700}}>{m.passenger_count}</td>
                        <td style={{fontSize:11,color:'var(--text2)'}}><div>{m.from_location||m.from_city||'—'}</div><div style={{fontSize:9,color:'var(--text3)'}}>{m.from_city}</div></td>
                        <td style={{fontSize:11,color:'var(--text2)'}}><div>{m.to_location||m.to_city||'—'}</div><div style={{fontSize:9,color:'var(--text3)'}}>{m.to_city}</div></td>
                        <td>{m.flight_number?<span className="badge bg-gold" style={{fontSize:9}}>{m.flight_number}</span>:'—'}</td>
                        <td style={{fontSize:11}}>
                          {isExt
                            ? <div><div style={{fontWeight:600}}>{m.ext_driver_name||'—'}</div><div style={{fontSize:9,color:'var(--text3)'}}>{m.supplier_name}</div></div>
                            : m.driver_name
                              ? <div><div style={{fontWeight:600}}>{m.driver_name}</div><div style={{fontSize:9,color:'var(--text3)'}}>{m.driver_id_number}</div></div>
                              : <span style={{color:'var(--coral)',fontSize:11}}>⚠ لم يُعيَّن</span>}
                        </td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--text2)'}}>{isExt?(m.supplier_phone||'—'):(m.driver_phone||'—')}</td>
                        <td>{(m.plate_number||m.ext_plate_number)?<span className="badge bg-gray">{m.plate_number||m.ext_plate_number}</span>:'—'}</td>
                        <td><span className={`badge ${isExt?'bg-coral':'bg-teal'}`} style={{fontSize:9}}>{isExt?'خارجي':'داخلي'}</span></td>
                        <td>
                          <select value={m.status} onChange={async e=>{ await patchStatus(m.id,e.target.value); load(); }}
                            style={{width:110,fontSize:10,padding:'3px 5px'}}>
                            {STATUSES.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <button className={`btn btn-sm ${isOpen?'btn-primary':'btn-ghost'}`}
                            onClick={()=>setAssignId(isOpen?null:m.id)}>
                            {isOpen?'إغلاق':'تعيين'}
                          </button>
                        </td>
                      </tr>,
                      isOpen && (
                        <tr key={m.id+'-assign'}>
                          <td colSpan={16} style={{padding:'4px 10px 10px'}}>
                            <AssignPanel m={m} drivers={drivers} vehicles={vehicles}
                              onClose={()=>setAssignId(null)}
                              onSaved={()=>{ setAssignId(null); load(); }}/>
                          </td>
                        </tr>
                      )
                    ];
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
