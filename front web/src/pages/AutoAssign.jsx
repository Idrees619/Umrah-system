import { useState } from 'react';

const API = 'https://umrah-system-backend.onrender.com/api';

const TYPE_CLS = {
  'وصول': 'bg-teal', 'تنقل': 'bg-purple',
  'مزارات': 'bg-amber', 'مغادرة': 'bg-coral',
};
const TYPE_CLR = {
  'وصول': 'var(--teal)', 'تنقل': 'var(--purple)',
  'مزارات': 'var(--amber)', 'مغادرة': 'var(--coral)',
};

export default function AutoAssign() {
  const today = new Date().toISOString().split('T')[0];
  const [date,        setDate]        = useState(today);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [applying,    setApplying]    = useState(false);
  const [done,        setDone]        = useState(false);
  const [msg,         setMsg]         = useState('');

  // تعديل اقتراح يدوياً
  const [overrides, setOverrides] = useState({}); // {movement_id: {driver_id, vehicle_id, skip}}

  const fetchSuggestions = async () => {
    setLoading(true); setDone(false); setMsg(''); setOverrides({});
    try {
      const r = await fetch(`${API}/auto-assign/suggestions?date=${date}`);
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      setSuggestions(j.data || []);
      if (!j.data?.length) setMsg(j.message || 'لا توجد حركات غير معيّنة في هذا اليوم ✓');
    } catch(e) { setMsg('خطأ: ' + e.message); }
    finally { setLoading(false); }
  };

  const applyAll = async () => {
    setApplying(true); setMsg('');
    try {
      // بناء قائمة التعيينات
      const assignments = suggestions
        .filter(s => {
          const ov = overrides[s.movement_id];
          if (ov?.skip) return false;
          return (ov?.driver_id || s.suggested_driver?.id);
        })
        .map(s => {
          const ov = overrides[s.movement_id];
          return {
            movement_id: s.movement_id,
            driver_id:   ov?.driver_id   || s.suggested_driver?.id,
            vehicle_id:  ov?.vehicle_id  || s.suggested_driver?.vehicle_id,
          };
        });

      const r = await fetch(`${API}/auto-assign/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      setDone(true);
      setMsg(`✅ تم تعيين ${j.applied} سائق بنجاح!`);
      setSuggestions([]);
    } catch(e) { setMsg('خطأ: ' + e.message); }
    finally { setApplying(false); }
  };

  const skipCount    = suggestions.filter(s => overrides[s.movement_id]?.skip).length;
  const noDriverCount= suggestions.filter(s => {
    const ov = overrides[s.movement_id];
    return !ov?.skip && !ov?.driver_id && !s.suggested_driver;
  }).length;
  const readyCount   = suggestions.length - skipCount - noDriverCount;

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div>
          <div className="page-title">التوزيع التلقائي للسائقين</div>
          <div className="page-sub">يقترح النظام السائق المناسب لكل حركة بناءً على الموقع والوقت والحمل</div>
        </div>
      </div>

      <div className="page-body">
        {/* بطاقة الشرح */}
        <div style={{
          background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,.3)',
          borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 18,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14,
        }}>
          {[
            { icon: '📍', label: 'الموقع',    desc: 'يختار سائقاً في نفس المدينة أو قريباً منها' },
            { icon: '⏱',  label: 'الوقت',     desc: 'يضمن وقتاً كافياً بين الرحلات' },
            { icon: '📊', label: 'الحمل',     desc: 'يوزع الرحلات بالتساوي بين السائقين' },
            { icon: '🚫', label: 'الحد الأقصى', desc: 'لا يتجاوز خطين طويلين أو 3 قصيرة' },
          ].map(x => (
            <div key={x.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{x.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--gold)' }}>{x.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{x.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* اختيار التاريخ */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                  اختر تاريخ التوزيع:
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => setDate(today)}>اليوم</button>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  const d = new Date(date); d.setDate(d.getDate()+1);
                  setDate(d.toISOString().split('T')[0]);
                }}>غداً</button>
              </div>
              <button className="btn btn-primary" onClick={fetchSuggestions} disabled={loading}>
                {loading ? '⏳ جاري التحليل...' : '🔍 تحليل وعرض الاقتراحات'}
              </button>
            </div>
          </div>
        </div>

        {/* رسالة */}
        {msg && (
          <div style={{
            background: done ? 'var(--green-dim)' : 'var(--amber-dim)',
            border: `1px solid ${done ? 'rgba(74,222,128,.3)' : 'rgba(251,191,36,.3)'}`,
            borderRadius: 'var(--r-md)', padding: '10px 16px', marginBottom: 14,
            color: done ? 'var(--green)' : 'var(--amber)', fontSize: 13, fontWeight: 600,
          }}>
            {msg}
          </div>
        )}

        {/* الاقتراحات */}
        {suggestions.length > 0 && (
          <>
            {/* شريط الملخص */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {suggestions.length} حركة — 
                <span style={{ color: 'var(--green)', fontWeight: 600, marginRight: 4 }}>{readyCount} جاهزة</span>
                {noDriverCount > 0 && <span style={{ color: 'var(--coral)', fontWeight: 600, marginRight: 4 }}>{noDriverCount} بلا سائق</span>}
                {skipCount > 0 && <span style={{ color: 'var(--text3)', marginRight: 4 }}>{skipCount} متخطاة</span>}
              </span>
              <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setOverrides(prev => {
                    const next = {...prev};
                    suggestions.forEach(s => { next[s.movement_id] = { ...next[s.movement_id], skip: true }; });
                    return next;
                  })}>تخطي الكل</button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setOverrides({})}>إعادة الكل</button>
                <button className="btn btn-primary" onClick={applyAll}
                  disabled={applying || readyCount === 0}>
                  {applying ? '⏳ جاري التطبيق...' : `✓ تطبيق التوزيع (${readyCount})`}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{width:60}}>الوقت</th>
                      <th style={{width:80}}>النوع</th>
                      <th style={{width:140}}>المجموعة</th>
                      <th style={{width:60}}>من</th>
                      <th style={{width:60}}>إلى</th>
                      <th style={{width:60}}>نوع الخط</th>
                      <th style={{width:160}}>السائق المقترح</th>
                      <th style={{width:80}}>اللوحة</th>
                      <th style={{width:60}}>موقعه</th>
                      <th style={{width:80}}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map(s => {
                      const ov     = overrides[s.movement_id] || {};
                      const skip   = ov.skip;
                      const drv    = s.suggested_driver;
                      const hasDriver = drv || ov.driver_id;

                      return (
                        <tr key={s.movement_id} style={{
                          opacity: skip ? 0.4 : 1,
                          background: skip ? 'var(--bg2)' : hasDriver ? '' : 'rgba(251,113,133,.03)',
                        }}>
                          <td>
                            <span style={{ fontFamily: 'IBM Plex Mono', color: 'var(--gold)', fontWeight: 700 }}>
                              {s.movement_time?.slice(0,5)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${TYPE_CLS[s.movement_type]||'bg-gray'}`}>
                              <span className="dot" style={{ background: TYPE_CLR[s.movement_type] }} />
                              {s.movement_type}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{s.group_name||'—'}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{s.passenger_count} فرد</div>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text2)' }}>{s.from_city}</td>
                          <td style={{ fontSize: 11, color: 'var(--text2)' }}>{s.to_city}</td>
                          <td>
                            <span className={`badge ${s.is_long ? 'bg-coral' : 'bg-gray'}`} style={{ fontSize: 9 }}>
                              {s.is_long ? 'طويل' : 'قصير'}
                            </span>
                          </td>
                          <td>
                            {skip ? (
                              <span style={{ color: 'var(--text3)', fontSize: 11 }}>متخطى</span>
                            ) : drv ? (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{drv.name}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)' }}>{drv.phone}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--coral)', fontSize: 11 }}>⚠ لا يوجد سائق متاح</span>
                            )}
                          </td>
                          <td>
                            {!skip && drv && (
                              <span className="badge bg-gray">{drv.plate_number||'—'}</span>
                            )}
                          </td>
                          <td>
                            {!skip && drv && (
                              <span className="badge bg-teal" style={{ fontSize: 9 }}>{drv.current_location}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {!skip && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: 10, color: 'var(--coral)' }}
                                  onClick={() => setOverrides(prev => ({
                                    ...prev, [s.movement_id]: { ...prev[s.movement_id], skip: true }
                                  }))}>
                                  تخطي
                                </button>
                              )}
                              {skip && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: 10 }}
                                  onClick={() => setOverrides(prev => ({
                                    ...prev, [s.movement_id]: { ...prev[s.movement_id], skip: false }
                                  }))}>
                                  استرجاع
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* زر التطبيق في الأسفل */}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => { setSuggestions([]); setOverrides({}); }}>
                إلغاء
              </button>
              <button className="btn btn-primary" onClick={applyAll}
                disabled={applying || readyCount === 0} style={{ fontSize: 13 }}>
                {applying ? '⏳ جاري التطبيق...' : `✓ تطبيق التوزيع على ${readyCount} حركة`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
