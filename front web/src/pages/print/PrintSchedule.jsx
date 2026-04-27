import { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

const TYPE_CSS = {
  'وصول':   'pt-arrival',
  'تنقل':   'pt-transfer',
  'مزارات': 'pt-visit',
  'مغادرة': 'pt-departure',
};

const STATUS_CSS = {
  'منتهي':          'sb-done',
  'جاري':           'sb-active',
  'مجدول':          'sb-pending',
  'تحتاج-مراجعة':  'sb-review',
};

export default function PrintSchedule() {
  // ── فلاتر ──
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [moveType,   setMoveType]   = useState('');
  const [driverType, setDriverType] = useState('');
  const [cityFrom,   setCityFrom]   = useState('');
  const [cityTo,     setCityTo]     = useState('');
  const [company,    setCompany]    = useState('');
  const [nat,        setNat]        = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [printMode,  setPrintMode]  = useState('delegate'); // delegate | agent

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // قراءة الباراميترات من URL عند الفتح
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('date'))         { setDateFrom(p.get('date')); setDateTo(p.get('date')); }
    if (p.get('date_from'))    setDateFrom(p.get('date_from'));
    if (p.get('date_to'))      setDateTo(p.get('date_to'));
    if (p.get('type'))         setMoveType(p.get('type'));
    if (p.get('driver_type'))  setDriverType(p.get('driver_type'));
    if (p.get('nationality'))  setNat(p.get('nationality'));
    if (p.get('company'))      setCompany(p.get('company'));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom)   params.set('date_from',   dateFrom);
      if (dateTo)     params.set('date_to',     dateTo);
      if (moveType)   params.set('type',        moveType);
      if (driverType) params.set('driver_type', driverType);
      if (cityFrom)   params.set('city_from',   cityFrom);
      if (cityTo)     params.set('city_to',     cityTo);
      if (company)    params.set('company',     company);
      if (nat)        params.set('nationality', nat);
      const r = await fetch(`${API}/movements?${params}`);
      const j = await r.json();
      let data = j.data || [];
      if (statusF) data = data.filter(m => m.status === statusF);
      setRows(data);
      setFetched(true);
    } finally { setLoading(false); }
  };

  const now    = new Date().toLocaleString('ar-SA');
  const period = dateFrom === dateTo ? dateFrom : `${dateFrom} — ${dateTo}`;
  const CITIES = ['مكة','مدينة','جدة','مطار-جدة','مطار-مدينة'];

  const modeLabel = printMode === 'delegate' ? 'للمندوب' : 'للوكيل';

  return (
    <div className="print-wrap">
      {/* ── أدوات التحكم ── */}
      <div className="print-controls no-print">
        <span className="pc-lbl">من:</span>
        <input className="pc-inp" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="pc-lbl">إلى:</span>
        <input className="pc-inp" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />

        <select className="pc-sel" value={moveType} onChange={e => setMoveType(e.target.value)}>
          <option value="">كل الأنواع</option>
          {['وصول','تنقل','مزارات','مغادرة'].map(t => <option key={t}>{t}</option>)}
        </select>

        <select className="pc-sel" value={driverType} onChange={e => setDriverType(e.target.value)}>
          <option value="">داخلي + خارجي</option>
          <option value="internal">داخلي فقط</option>
          <option value="external">خارجي فقط</option>
        </select>

        <select className="pc-sel" value={cityFrom} onChange={e => setCityFrom(e.target.value)}>
          <option value="">من (كل المدن)</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select className="pc-sel" value={cityTo} onChange={e => setCityTo(e.target.value)}>
          <option value="">إلى (كل المدن)</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <input className="pc-inp" style={{width:130}} placeholder="الشركة / الوكيل"
          value={company} onChange={e => setCompany(e.target.value)} />

        <input className="pc-inp" style={{width:90}} placeholder="الجنسية"
          value={nat} onChange={e => setNat(e.target.value)} />

        <select className="pc-sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">كل الحالات</option>
          {['مجدول','جاري','منتهي','ملغي','تحتاج-مراجعة'].map(s => <option key={s}>{s}</option>)}
        </select>

        {/* نوع الطباعة */}
        <div style={{display:'flex',gap:6,alignItems:'center',borderRight:'1px solid #ccc',paddingRight:10}}>
          <span className="pc-lbl">وجهة الطباعة:</span>
          <button className={`pc-btn ${printMode==='delegate'?'pc-dark':'pc-gray'}`}
            onClick={() => setPrintMode('delegate')}>للمندوب</button>
          <button className={`pc-btn ${printMode==='agent'?'pc-dark':'pc-gray'}`}
            onClick={() => setPrintMode('agent')}>للوكيل</button>
        </div>

        <button className="pc-btn pc-dark" onClick={fetchData} disabled={loading}>
          {loading ? 'جاري التحميل...' : '🔍 عرض'}
        </button>

        {fetched && (
          <button className="pc-btn pc-gold" onClick={() => window.print()}>
            🖨 طباعة / PDF
          </button>
        )}
      </div>

      {fetched && (
        <div className="print-page">
          {/* رأس الصفحة */}
          <div className="p-header">
            <div>
              <h1>🕋 نظام نقل العمرة</h1>
              <p>تقرير حركات التشغيل — {modeLabel}</p>
            </div>
            <div className="p-header-left">
              <strong>جدول التحركات {modeLabel}</strong>
              الفترة: {period}<br />
              {moveType && `النوع: ${moveType} — `}
              {nat && `الجنسية: ${nat} — `}
              {company && `الشركة: ${company}`}<br />
              طُبع: {now}
            </div>
          </div>

          {/* شريط العنوان */}
          <div className="p-title-bar">
            <h2>
              {moveType || 'كل التحركات'}
              {cityFrom ? ` — من ${cityFrom}` : ''}
              {cityTo   ? ` إلى ${cityTo}`    : ''}
              {nat      ? ` — ${nat}`         : ''}
            </h2>
            <span>{rows.length} حركة</span>
          </div>

          {/* ملخص */}
          <div className="p-sum">
            {[
              {l:'إجمالي الحركات', v:rows.length,                                        acc:true},
              {l:'وصولات',  v:rows.filter(r=>r.movement_type==='وصول').length,            acc:false},
              {l:'تنقلات',  v:rows.filter(r=>r.movement_type==='تنقل').length,            acc:false},
              {l:'مغادرات', v:rows.filter(r=>r.movement_type==='مغادرة').length,          acc:false},
            ].map(s => (
              <div key={s.l} className={`p-sum-card${s.acc?' acc':''}`}>
                <div className="sl">{s.l}</div>
                <div className="sv">{s.v}</div>
              </div>
            ))}
          </div>

          {/* الجدول — للمندوب */}
          {printMode === 'delegate' && (
            <table className="p-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>النوع</th>
                  <th>المجموعة / الضيف</th>
                  <th>الجنسية</th>
                  <th>العدد</th>
                  <th>من (فندق)</th>
                  <th>إلى (فندق)</th>
                  <th>رقم الرحلة</th>
                  <th>الكابتن</th>
                  <th>جوال الكابتن</th>
                  <th>اللوحة</th>
                  <th>داخلي/خارجي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const isExt = m.driver_type === 'external';
                  return (
                    <tr key={m.id}>
                      <td style={{color:'#000',fontSize:8}}>{i+1}</td>
                      <td style={{fontWeight:600,whiteSpace:'nowrap'}}>{m.movement_date}</td>
                      <td style={{fontWeight:700,color:'#c9a84c'}}>{m.movement_time?.slice(0,5)}</td>
                      <td><span className={`pt-arr ${TYPE_CSS[m.movement_type]||''}`}>{m.movement_type}</span></td>
                      <td>
                        <div style={{fontWeight:600}}>{m.guest_name||m.group_name||'—'}</div>
                        <div style={{fontSize:8,color:'#000'}}>{m.company_name}</div>
                      </td>
                      <td>{m.nationality||'—'}</td>
                      <td style={{textAlign:'center',fontWeight:700}}>{m.passenger_count}</td>
                      <td style={{fontSize:8}}>{m.from_location||m.from_city}</td>
                      <td style={{fontSize:8}}>{m.to_location||m.to_city}</td>
                      <td style={{fontSize:8,color:'#000'}}>{m.flight_number||'—'}</td>
                      <td style={{fontWeight:600}}>
                        {isExt ? (m.ext_driver_name||'—') : (m.driver_name||<span style={{color:'red'}}>⚠ لم يُعيَّن</span>)}
                      </td>
                      <td style={{fontSize:8}}>
                        {isExt ? (m.supplier_phone||'—') : (m.driver_phone||'—')}
                      </td>
                      <td style={{fontSize:8}}>{m.plate_number||m.ext_plate_number||'—'}</td>
                      <td>
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:8,
                          background:isExt?'#fee2e2':'#d1fae5',
                          color:isExt?'#7f1d1d':'#065f46'}}>
                          {isExt ? 'خارجي' : 'داخلي'}
                        </span>
                      </td>
                      <td>
                        <span className={`pt-arr ${STATUS_CSS[m.status]||'sb-pending'}`}>{m.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* الجدول — للوكيل (يُظهر بيانات السائق والجوال لتواصل الوكيل) */}
          {printMode === 'agent' && (
            <table className="p-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>النوع</th>
                  <th>المجموعة / الضيف</th>
                  <th>الوكيل / الشركة</th>
                  <th>الجنسية</th>
                  <th>العدد</th>
                  <th>من</th>
                  <th>إلى</th>
                  <th>رحلة</th>
                  <th>الكابتن</th>
                  <th>جوال الكابتن</th>
                  <th>رقم هوية الكابتن</th>
                  <th>اللوحة</th>
                  <th>الناقل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const isExt = m.driver_type === 'external';
                  return (
                    <tr key={m.id}>
                      <td style={{color:'#000',fontSize:8}}>{i+1}</td>
                      <td style={{fontWeight:600,whiteSpace:'nowrap'}}>{m.movement_date}</td>
                      <td style={{fontWeight:700,color:'#c9a84c'}}>{m.movement_time?.slice(0,5)}</td>
                      <td><span className={`pt-arr ${TYPE_CSS[m.movement_type]||''}`}>{m.movement_type}</span></td>
                      <td>
                        <div style={{fontWeight:600}}>{m.guest_name||m.group_name||'—'}</div>
                        <div style={{fontSize:8,color:'#000'}}>#{m.booking_number}</div>
                      </td>
                      <td style={{fontSize:8}}>
                        <div>{m.agent_name||m.company_name||'—'}</div>
                        {m.agent_phone&&<div style={{color:'#000'}}>{m.agent_phone}</div>}
                      </td>
                      <td>{m.nationality||'—'}</td>
                      <td style={{textAlign:'center',fontWeight:700}}>{m.passenger_count}</td>
                      <td style={{fontSize:8}}>{m.from_location||m.from_city}</td>
                      <td style={{fontSize:8}}>{m.to_location||m.to_city}</td>
                      <td style={{fontSize:8,color:'#000'}}>{m.flight_number||'—'}</td>
                      <td style={{fontWeight:600,fontSize:9}}>
                        {isExt ? (m.ext_driver_name||'—') : (m.driver_name||<span style={{color:'red'}}>⚠</span>)}
                      </td>
                      <td style={{fontSize:8}}>
                        {isExt ? (m.supplier_phone||'—') : (m.driver_phone||'—')}
                      </td>
                      <td style={{fontSize:8,color:'#000'}}>
                        {isExt ? '—' : (m.driver_id_number||'—')}
                      </td>
                      <td style={{fontSize:8}}>{m.plate_number||m.ext_plate_number||'—'}</td>
                      <td style={{fontSize:8}}>
                        {isExt ? (m.supplier_name||'—') : 'داخلي'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {rows.length === 0 && (
            <div style={{textAlign:'center',padding:30,color:'#000',fontSize:12}}>
              لا توجد حركات تطابق الفلتر المحدد
            </div>
          )}

          {/* تذييل */}
          <div className="p-footer">
            <span>نظام نقل العمرة — تقرير التحركات {modeLabel}</span>
            <span>الفترة: {period}</span>
            <span>الإجمالي: {rows.length} حركة</span>
          </div>
        </div>
      )}
    </div>
  );
}
