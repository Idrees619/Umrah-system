import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBooking, createBooking, updateBooking } from '../utils/api';

const API = 'https://umrah-system-backend.onrender.com';

const TEMPLATES = [
  { key: 'MAK-5-FULL', label: 'خمس خطوات (مكة ← مدينة)', steps: [
    { t: 'وصول', fc: 'مطار-جدة', tc: 'مكة', fl: 'مطار جدة', tl: 'فندق مكة', tm: '08:00', d: 0 },
    { t: 'مزارات', fc: 'مكة', tc: 'مكة', fl: 'فندق مكة', tl: 'مزارات مكة', tm: '08:00', d: 1 },
    { t: 'تنقل', fc: 'مكة', tc: 'مدينة', fl: 'فندق مكة', tl: 'فندق المدينة', tm: '10:00', d: 3 },
    { t: 'مزارات', fc: 'مدينة', tc: 'مدينة', fl: 'فندق المدينة', tl: 'مزارات المدينة', tm: '08:00', d: 4 },
    { t: 'مغادرة', fc: 'مدينة', tc: 'مطار-مدينة', fl: 'فندق المدينة', tl: 'مطار المدينة', tm: '16:00', d: 6 },
  ]},
  { key: 'MED-5-FULL', label: 'خمس خطوات (مدينة ← مكة)', steps: [
    { t: 'وصول', fc: 'مطار-مدينة', tc: 'مدينة', fl: 'مطار المدينة', tl: 'فندق المدينة', tm: '08:00', d: 0 },
    { t: 'مزارات', fc: 'مدينة', tc: 'مدينة', fl: 'فندق المدينة', tl: 'مزارات المدينة', tm: '08:00', d: 1 },
    { t: 'تنقل', fc: 'مدينة', tc: 'مكة', fl: 'فندق المدينة', tl: 'فندق مكة', tm: '10:00', d: 3 },
    { t: 'مزارات', fc: 'مكة', tc: 'مكة', fl: 'فندق مكة', tl: 'مزارات مكة', tm: '08:00', d: 4 },
    { t: 'مغادرة', fc: 'مكة', tc: 'مطار-جدة', fl: 'فندق مكة', tl: 'مطار جدة', tm: '16:00', d: 6 },
  ]},
  { key: 'MAK-3-SHORT', label: 'ثلاث خطوات (استقبال - تنقل - مغادرة)', steps: [
    { t: 'وصول', fc: 'مطار-جدة', tc: 'مكة', fl: 'مطار جدة', tl: 'فندق مكة', tm: '08:00', d: 0 },
    { t: 'تنقل', fc: 'مكة', tc: 'مدينة', fl: 'فندق مكة', tl: 'فندق المدينة', tm: '10:00', d: 3 },
    { t: 'مغادرة', fc: 'مدينة', tc: 'مطار-مدينة', fl: 'فندق المدينة', tl: 'مطار المدينة', tm: '16:00', d: 5 },
  ]},
  { key: 'SINGLE-ARR', label: 'حركة واحدة: استقبال فقط', steps: [{ t: 'وصول', fc: 'مطار-جدة', tc: 'مكة', fl: 'مطار جدة', tl: 'فندق مكة', tm: '09:00', d: 0 }] },
  { key: 'SINGLE-VISIT', label: 'حركة واحدة: مزارات فقط', steps: [{ t: 'مزارات', fc: 'مكة', tc: 'مكة', fl: 'فندق مكة', tl: 'مزارات مكة', tm: '08:00', d: 0 }] },
  { key: 'SINGLE-TRANS', label: 'حركة واحدة: تنقل بين المدن', steps: [{ t: 'تنقل', fc: 'مكة', tc: 'مدينة', fl: 'فندق مكة', tl: 'فندق المدينة', tm: '10:00', d: 0 }] },
  { key: 'CUSTOM', label: 'مخصص (إضافة يدوية)', steps: [] },
];

const CITIES = ['مكة','مدينة','جدة','مطار-جدة','مطار-مدينة','أخرى'];
const TYPES = ['وصول','تنقل','مزارات','مغادرة'];
const TCLR = {'وصول':'var(--teal)','تنقل':'var(--purple)','مزارات':'var(--amber)','مغادرة':'var(--coral)'};
const STATUSES_BOOKING = ['نشط','قيد التنفيذ','منتهي','ملغي','تحتاج-مراجعة','متابعة-فقط','نقل-مستأجر'];

function addDays(d,n){ if(!d)return''; const x=new Date(d); x.setDate(x.getDate()+n); return x.toISOString().split('T')[0]; }

export default function BookingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [f, setF] = useState({
    group_number:'', group_name:'', guest_name:'', company_name:'',
    agent_name:'', agent_phone:'', agent_id:'', nationality:'', passenger_count:'',
    template_type:'', arrival_date:'', departure_date:'',
    status:'نشط', invoice_ref:'', notes:'', booking_number:'',
  });
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [err, setErr] = useState('');

  // ═══ بيانات الوكلاء ═══
  const [agentsList, setAgentsList] = useState([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const nationalities = [...new Set(agentsList.map(a => a.nationality).filter(Boolean))];

  useEffect(() => {
    fetch(`${API}/agents`)
      .then(r => r.json())
      .then(j => setAgentsList(j.data || []))
      .catch(() => {});
  }, []);

  const filteredAgents = agentSearch
    ? agentsList.filter(a =>
        (a.name||'').toLowerCase().includes(agentSearch.toLowerCase()) ||
        (a.phone||'').includes(agentSearch)
      )
    : agentsList;

  const selectAgent = (agent) => {
    setF(p => ({
      ...p,
      agent_name: agent.name,
      agent_phone: agent.phone || '',
      agent_id: agent.id,
      nationality: agent.nationality || p.nationality,
    }));
    setAgentSearch(agent.name);
    setShowAgentDropdown(false);
  };

  // ─── تحميل بيانات الحجز ───
  useEffect(() => {
    if(!isEdit) return;
    getBooking(id).then(r => {
      const b = r.data.data;
      setF({
        group_number: b.group_number||'', group_name: b.group_name||'', guest_name: b.guest_name||'',
        company_name: b.company_name||'', agent_name: b.agent_name||'', agent_phone: b.agent_phone||'',
        agent_id: b.agent_id||'', nationality: b.nationality||'', passenger_count: b.passenger_count||'',
        template_type: b.template_type||'', arrival_date: b.arrival_date||'',
        departure_date: b.departure_date||'', status: b.status||'نشط',
        invoice_ref: b.invoice_ref||'', notes: b.notes||'',
        booking_number: b.booking_number||'',
      });
      setSteps((b.movements||[]).map(m => ({
        movement_type: m.movement_type, from_city: m.from_city||'مكة', to_city: m.to_city||'مكة',
        from_location: m.from_location||'', to_location: m.to_location||'',
        movement_date: m.movement_date||'', movement_time: m.movement_time?.slice(0,5)||'09:00',
        flight_number: m.flight_number||'', bus_count: m.bus_count||1,
        status: m.status||'مجدول', notes: m.notes||'',
      })));
      setAgentSearch(b.agent_name||'');
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const applyTpl = (key) => {
    const tpl = TEMPLATES.find(t => t.key===key);
    if(!tpl) return;
    const base = f.arrival_date || new Date().toISOString().split('T')[0];
    setSteps(tpl.steps.map((s,i) => ({
      movement_type: s.t, from_city: s.fc, to_city: s.tc,
      from_location: s.fl, to_location: s.tl,
      movement_date: addDays(base, s.d), movement_time: s.tm,
      flight_number:'', bus_count:1, status:'مجدول', notes:'', sort_order:i+1,
    })));
    setF(p => ({...p, template_type: key}));
  };

  const upd = (i,k,v) => setSteps(p => p.map((s,j) => j===i ? {...s,[k]:v} : s));
  const addStep = () => setSteps(p => [...p, {
    movement_type:'تنقل', from_city:'مكة', to_city:'مدينة',
    from_location:'', to_location:'', movement_date: f.arrival_date||'', movement_time:'09:00',
    flight_number:'', bus_count:1, status:'مجدول', notes:''
  }]);
  const delStep = i => setSteps(p => p.filter((_,j) => j!==i));
  const mvStep = (i,d) => { const a=[...steps]; const t=a[i]; a[i]=a[i+d]; a[i+d]=t; setSteps(a); };

  const save = async () => {
    if(!f.group_name && !f.guest_name){ setErr('اسم المجموعة أو الضيف مطلوب'); return; }
    if(!f.passenger_count){ setErr('عدد المعتمرين مطلوب'); return; }
    if(!f.agent_id){ setErr('يجب اختيار وكيل من قائمة الوكلاء المسجلين'); return; } // ✅ إجبار على الاختيار
    setSaving(true); setErr('');
    try {
      const payload = { ...f, movements: steps.map((s,i) => ({...s, sort_order: i+1})) };
      delete payload.booking_number;
      if(isEdit) await updateBooking(id, payload);
      else await createBooking(payload);
      navigate('/bookings');
    } catch(e) {
      setErr(e.response?.data?.error || 'خطأ في الحفظ: ' + e.message);
    } finally { setSaving(false); }
  };

  if(loading) return <div className="loading">⏳ جاري التحميل...</div>;

  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--border)',padding:'10px 18px',display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          💾 {saving?'جاري الحفظ...':isEdit?'حفظ التعديلات':'حفظ الحجز'}
        </button>
        <button className="btn btn-ghost" onClick={()=>navigate('/bookings')}>↩ رجوع</button>
        <div style={{flex:1}}/>
        <span style={{fontSize:13,fontWeight:700,color:'var(--gold)'}}>
          {isEdit ? `تعديل حجز #${f.booking_number || id.slice(0,8)}` : 'حجز جديد'}
        </span>
      </div>

      {err && <div className="err-box" style={{margin:'8px 18px'}}>{err}</div>}

      <div style={{flex:1,overflow:'auto',padding:16}}>
        <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:14,height:'100%'}}>
          {/* القسم الأيمن */}
          <div style={{display:'flex',flexDirection:'column',gap:10,overflow:'auto'}}>
            <div className="card">
              <div className="card-hdr" style={{background:'var(--gold-dim)'}}>
                <span className="card-title" style={{color:'var(--gold)'}}>بيانات الحجز</span>
              </div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:9}}>

                <div className="fg2">
                  <div className="fg">
                    <label className="fl">رقم التشغيل</label>
                    <input type="text" value={f.booking_number || 'تلقائي'} readOnly
                      style={{background:'var(--bg3)', color: f.booking_number?'':'var(--text3)', fontStyle: f.booking_number?'normal':'italic'}} />
                  </div>
                  <div className="fg">
                    <label className="fl">خط السير (القالب)</label>
                    <select value={f.template_type} onChange={e => { setF(p=>({...p,template_type:e.target.value})); applyTpl(e.target.value); }}>
                      <option value="">اختر القالب</option>
                      {TEMPLATES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                      <option value="CUSTOM">مخصص</option>
                    </select>
                  </div>
                </div>

                <div className="fg">
                  <label className="fl">اسم الضيف / المجموعة *</label>
                  <input type="text" value={f.guest_name||f.group_name}
                    onChange={e => setF(p=>({...p, guest_name:e.target.value, group_name:e.target.value}))} />
                </div>

                <div className="fg">
                  <label className="fl">اسم المجموعة (الكشف)</label>
                  <input type="text" value={f.group_name}
                    onChange={e => setF(p=>({...p, group_name:e.target.value}))} />
                </div>

                {/* ────── الوكيل (قائمة منسدلة فقط) ────── */}
                <div className="fg">
                  <label className="fl">الوكيل الخارجي *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={agentSearch}
                      onFocus={() => setShowAgentDropdown(true)}
                      onChange={e => {
                        setAgentSearch(e.target.value);
                        setShowAgentDropdown(true);
                        if (!e.target.value.trim()) {
                          setF(p => ({ ...p, agent_name:'', agent_phone:'', agent_id:'' }));
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowAgentDropdown(false), 300)}
                      placeholder="اختر وكيلاً من المسجلين..."
                      autoComplete="off"
                    />
                    {showAgentDropdown && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '0 0 var(--r-md) var(--r-md)', zIndex: 20,
                        maxHeight: 200, overflowY: 'auto'
                      }}>
                        {filteredAgents.length === 0 ? (
                          <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: 12 }}>
                            {agentSearch ? 'لا يوجد وكلاء مطابقين' : 'لا يوجد وكلاء مسجلين بعد'}
                          </div>
                        ) : (
                          filteredAgents.map(agent => (
                            <div
                              key={agent.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectAgent(agent);
                              }}
                              style={{
                                padding: '8px 12px', cursor: 'pointer',
                                fontSize: 13, borderBottom: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between',
                                background: f.agent_id === agent.id ? 'var(--gold-dim)' : 'transparent'
                              }}
                            >
                              <span>{agent.name}</span>
                              <span style={{ color: 'var(--text3)', fontSize: 11 }}>{agent.phone || ''}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fg">
                  <label className="fl">جوال الوكيل</label>
                  <input type="text" value={f.agent_phone} readOnly />
                </div>

                <div className="fg">
                  <label className="fl">الجنسية</label>
                  <input type="text" list="nationality-list" value={f.nationality}
                    onChange={e => setF(p => ({ ...p, nationality: e.target.value }))}
                    placeholder="تعبأ تلقائياً عند اختيار وكيل" />
                  <datalist id="nationality-list">
                    {nationalities.map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>

                <div className="fg3">
                  <div className="fg"><label className="fl">عدد المعتمرين *</label>
                    <input type="number" value={f.passenger_count} onChange={e => setF(p=>({...p, passenger_count:e.target.value}))} /></div>
                  <div className="fg"><label className="fl">مجموعة</label>
                    <input type="text" value={f.group_number} onChange={e => setF(p=>({...p, group_number:e.target.value}))} /></div>
                </div>

                <div className="fg2">
                  <div className="fg"><label className="fl">تاريخ الوصول</label>
                    <input type="date" value={f.arrival_date} onChange={e => setF(p=>({...p, arrival_date:e.target.value}))} /></div>
                  <div className="fg"><label className="fl">تاريخ المغادرة</label>
                    <input type="date" value={f.departure_date} onChange={e => setF(p=>({...p, departure_date:e.target.value}))} /></div>
                </div>

                <div className="fg2">
                  <div className="fg"><label className="fl">الشركة / الناقل</label>
                    <input type="text" value={f.company_name} onChange={e => setF(p=>({...p, company_name:e.target.value}))} /></div>
                  <div className="fg"><label className="fl">الحالة</label>
                    <select value={f.status} onChange={e => setF(p=>({...p, status:e.target.value}))}>
                      {STATUSES_BOOKING.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>

                <div className="fg"><label className="fl">ملاحظات</label>
                  <textarea value={f.notes} onChange={e => setF(p=>({...p, notes:e.target.value}))} style={{minHeight:48}} /></div>
              </div>
            </div>

            {steps.length>0 && (
              <div className="card">
                <div className="card-hdr"><span className="card-title">ملخص المسار</span></div>
                <div className="card-body" style={{display:'flex',flexDirection:'column',gap:5}}>
                  {steps.map((s,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:TCLR[s.movement_type]}}/>
                      <span style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text3)',minWidth:80}}>{s.movement_date} {s.movement_time}</span>
                      <span className="badge" style={{fontSize:8,background:'var(--bg3)',color:'var(--text2)'}}>{s.movement_type}</span>
                      <span style={{fontSize:10,color:'var(--text2)'}}>{s.from_city}←{s.to_city}</span>
                      <span style={{fontSize:9,color:'var(--text3)',flex:1}}>{s.from_location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* جدول الحركات */}
          <div className="card" style={{display:'flex',flexDirection:'column'}}>
            <div className="card-hdr">
              <span className="card-title">معلومات النقل — {steps.length} خطوة</span>
              <button className="btn btn-ghost btn-sm" onClick={addStep}>+ إضافة خطوة</button>
            </div>
            {steps.length===0 ? (
              <div className="empty">اختر قالباً من اليمين، أو أضف خطوات يدوياً</div>
            ) : (
              <div style={{flex:1,overflow:'auto'}}>
                <table style={{fontSize:11}}>
                  <thead>
                    <tr>
                      <th style={{width:28}}>#</th><th style={{width:85}}>نوع الحركة</th><th style={{width:95}}>التاريخ</th>
                      <th style={{width:65}}>الوقت</th><th style={{width:85}}>من</th><th style={{width:85}}>إلى</th>
                      <th style={{width:140}}>الموقع من</th><th style={{width:140}}>الموقع إلى</th>
                      <th style={{width:80}}>الرحلة</th><th style={{width:45}}>باصات</th>
                      <th style={{width:70}}>الحالة</th><th style={{width:55}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((s,idx) => (
                      <tr key={idx} style={{borderRight:`2.5px solid ${TCLR[s.movement_type]||'var(--border)'}`}}>
                        <td style={{color:'var(--text3)',textAlign:'center'}}>{idx+1}</td>
                        <td><select value={s.movement_type} onChange={e=>upd(idx,'movement_type',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></td>
                        <td><input type="date" value={s.movement_date||''} onChange={e=>upd(idx,'movement_date',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><input type="time" value={s.movement_time||''} onChange={e=>upd(idx,'movement_time',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><select value={s.from_city||''} onChange={e=>upd(idx,'from_city',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></td>
                        <td><select value={s.to_city||''} onChange={e=>upd(idx,'to_city',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></td>
                        <td><input type="text" value={s.from_location||''} onChange={e=>upd(idx,'from_location',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><input type="text" value={s.to_location||''} onChange={e=>upd(idx,'to_location',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><input type="text" value={s.flight_number||''} onChange={e=>upd(idx,'flight_number',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><input type="number" min="1" value={s.bus_count||1} onChange={e=>upd(idx,'bus_count',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 4px'}}/></td>
                        <td><select value={s.status||'مجدول'} onChange={e=>upd(idx,'status',e.target.value)} style={{width:'100%',fontSize:10,padding:'3px 2px'}}>{['مجدول','جاري','منتهي','ملغي','تحتاج-مراجعة'].map(ss=><option key={ss}>{ss}</option>)}</select></td>
                        <td>
                          <div style={{display:'flex',gap:2}}>
                            {idx>0&&<button onClick={()=>mvStep(idx,-1)} style={{background:'var(--bg3)',border:'none',borderRadius:3,padding:'2px 4px',cursor:'pointer',color:'var(--text2)',fontSize:10}}>↑</button>}
                            {idx<steps.length-1&&<button onClick={()=>mvStep(idx,1)} style={{background:'var(--bg3)',border:'none',borderRadius:3,padding:'2px 4px',cursor:'pointer',color:'var(--text2)',fontSize:10}}>↓</button>}
                            <button onClick={()=>delStep(idx)} style={{background:'var(--coral-dim)',border:'none',borderRadius:3,padding:'2px 5px',cursor:'pointer',color:'var(--coral)',fontSize:10}}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
