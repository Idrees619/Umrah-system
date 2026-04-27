import { useState, useEffect } from 'react';
import { getDashboard } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TYPE_CLS = { 'وصول':'bg-teal','تنقل':'bg-purple','مزارات':'bg-amber','مغادرة':'bg-coral' };
const TYPE_DOT = { 'وصول':'var(--teal)','تنقل':'var(--purple)','مزارات':'var(--amber)','مغادرة':'var(--coral)' };
const STS_CLS  = { 'مجدول':'bg-gray','جاري':'bg-teal','منتهي':'bg-green','ملغي':'bg-coral','تحتاج-مراجعة':'bg-amber' };

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">⏳ جاري التحميل...</div>;
  const s = data?.stats || {};

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div>
          <div className="page-title">الشاشة الرئيسية</div>
          <div className="page-sub">{new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>+ حجز جديد</button>
      </div>
      <div className="page-body">
        <div className="stat-grid stat-grid-4">
          {[
            {c:'gold',   label:'تحركات اليوم',   val:s.today_total||0,    meta:`غداً: ${s.tomorrow_total||0}`},
            {c:'teal',   label:'وصولات اليوم',   val:s.today_arrivals||0, meta:`مغادرات: ${s.today_departures||0}`},
            {c:'purple', label:'تنقلات',          val:s.today_transfers||0,meta:`مزارات: ${s.today_visits||0}`},
            {c:'coral',  label:'غير معيّنة',      val:s.unassigned||0,     meta:'تحتاج تعيين سائق'},
          ].map(x=>(
            <div key={x.label} className={`stat-card ${x.c}`}>
              <div className="s-label">{x.label}</div>
              <div className="s-val">{x.val}</div>
              <div className="s-meta">{x.meta}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {/* وصولات اليوم */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">وصولات اليوم</span>
              <span className="badge bg-teal">{data?.today_arrivals?.length||0}</span>
            </div>
            <div className="table-wrap">
              {!data?.today_arrivals?.length
                ? <div className="empty">لا توجد وصولات اليوم</div>
                : <table>
                    <thead><tr><th>الوقت</th><th>المجموعة</th><th>الجنسية</th><th>العدد</th><th>الكابتن</th><th>اللوحة</th></tr></thead>
                    <tbody>
                      {data.today_arrivals.map((m,i)=>(
                        <tr key={i} className="row-arrival">
                          <td><span style={{fontFamily:'IBM Plex Mono',color:'var(--gold)',fontWeight:700}}>{m.movement_time?.slice(0,5)}</span></td>
                          <td><div style={{fontWeight:600,fontSize:11}}>{m.guest_name||m.group_name||'—'}</div><div style={{fontSize:9,color:'var(--text3)'}}>{m.flight_number}</div></td>
                          <td><span className="badge bg-gray">{m.nationality||'—'}</span></td>
                          <td style={{textAlign:'center',fontWeight:700}}>{m.passenger_count}</td>
                          <td style={{fontSize:11}}>{m.driver_type==='external'?<span>{m.ext_driver_name||'—'}<br/><span style={{fontSize:9,color:'var(--text3)'}}>{m.supplier_name}</span></span>:<span>{m.driver_name||<span style={{color:'var(--coral)'}}>⚠ لم يُعيَّن</span>}<br/><span style={{fontSize:9,color:'var(--text3)'}}>{m.driver_phone}</span></span>}</td>
                          <td>{(m.plate_number||m.ext_plate_number)?<span className="badge bg-gray">{m.plate_number||m.ext_plate_number}</span>:'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          </div>

          {/* تحتاج تعيين سائق - معدل ليجلب حركات الغد فقط */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">حركات بدون سائق (ليوم غد)</span>
              <span className="badge bg-coral">
                {/* حساب العدد ليوم غد فقط */}
                {(() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    const tomStr = tom.toISOString().split('T')[0];
                    return data?.unassigned?.filter(m => m.movement_date?.startsWith(tomStr)).length || 0;
                })()}
              </span>
            </div>
            <div className="table-wrap">
              {(() => {
                // 1. تحديد تاريخ الغد
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                // 2. فلترة الحركات لتظهر فقط حركات الغد
                const tomorrowMovements = data?.unassigned?.filter(m => 
                  m.movement_date?.startsWith(tomorrowStr)
                ) || [];

                return tomorrowMovements.length === 0
                  ? <div className="empty" style={{color:'var(--green)'}}>✓ لا توجد حركات بدون سائق ليوم غد</div>
                  : <table>
                      <thead><tr><th>التاريخ</th><th>الوقت</th><th>النوع</th><th>المجموعة</th><th>من→إلى</th></tr></thead>
                      <tbody>
                        {tomorrowMovements.map((m,i)=>(
                          <tr key={i}>
                            <td style={{fontFamily:'IBM Plex Mono',fontSize:11}}>{m.movement_date?.slice(0,10)}</td>
                            <td><span style={{fontFamily:'IBM Plex Mono',color:'var(--gold)',fontWeight:700}}>{m.movement_time?.slice(0,5)}</span></td>
                            <td><span className={`badge ${TYPE_CLS[m.movement_type]||'bg-gray'}`}>{m.movement_type}</span></td>
                            <td style={{fontSize:11,fontWeight:600}}>{m.group_name||'—'}</td>
                            <td style={{fontSize:10,color:'var(--text2)'}}>{m.from_city}←{m.to_city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
