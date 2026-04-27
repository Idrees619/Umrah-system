import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, deleteBooking } from '../utils/api';

const STS_CLS = {
  'نشط':'bg-green','قيد التنفيذ':'bg-teal','منتهي':'bg-gray',
  'ملغي':'bg-coral','تحتاج-مراجعة':'bg-amber','متابعة-فقط':'bg-purple','نقل-مستأجر':'bg-gold',
};

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [nat,      setNat]      = useState('');

  const load = () => {
    setLoading(true);
    getBookings({ search, status, nationality: nat })
      .then(r => setBookings(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, nat]);

  const del = async (id, name) => {
    if (!window.confirm(`حذف حجز "${name}"؟`)) return;
    await deleteBooking(id);
    load();
  };

  const total = bookings.reduce((s, b) => s + (b.passenger_count || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div>
          <div className="page-title">الحجوزات</div>
          <div className="page-sub">{bookings.length} حجز — {total} فرد</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>+ حجز جديد</button>
      </div>
      <div className="page-body">
        {/* إحصائيات */}
        <div className="stat-grid stat-grid-4" style={{marginBottom:16}}>
          {[
            {c:'gold',   label:'إجمالي الحجوزات', val:bookings.length},
            {c:'teal',   label:'إجمالي الأفراد',  val:total},
            {c:'green',  label:'نشطة',             val:bookings.filter(b=>b.status==='نشط').length},
            {c:'coral',  label:'تحتاج مراجعة',    val:bookings.filter(b=>b.status==='تحتاج-مراجعة').length},
          ].map(x => (
            <div key={x.label} className={`stat-card ${x.c}`}>
              <div className="s-label">{x.label}</div>
              <div className="s-val">{x.val}</div>
            </div>
          ))}
        </div>

        {/* فلاتر */}
        <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <input type="text" placeholder="🔍 بحث بالاسم أو الشركة..."
            value={search} onChange={e => setSearch(e.target.value)} style={{flex:1,maxWidth:280}}/>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{width:160}}>
            <option value="">كل الحالات</option>
            {Object.keys(STS_CLS).map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="الجنسية" value={nat}
            onChange={e => setNat(e.target.value)} style={{width:100}}/>
          {(search||status||nat) &&
            <button className="btn btn-ghost btn-sm" style={{color:'var(--coral)'}}
              onClick={() => { setSearch(''); setStatus(''); setNat(''); }}>✕ مسح</button>}
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? <div className="loading">⏳ جاري التحميل...</div>
            : bookings.length === 0
              ? <div className="empty">
                  لا توجد حجوزات
                  <div style={{marginTop:12}}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/bookings/new')}>+ أضف أول حجز</button>
                  </div>
                </div>
              : <table>
                  <thead>
                    <tr>
                      <th>#</th><th>الضيف / المجموعة</th><th>الشركة / الوكيل</th>
                      <th>الجنسية</th><th>العدد</th><th>خط السير</th>
                      <th>الوصول</th><th>المغادرة</th><th>الحركات</th><th>الحالة</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td style={{fontFamily:'IBM Plex Mono',color:'var(--gold)',fontWeight:700,fontSize:12}}>
                          {b.booking_number}
                        </td>
                        <td>
                          <div style={{fontWeight:600,fontSize:12}}>{b.guest_name||b.group_name||'—'}</div>
                          <div style={{fontSize:9,color:'var(--text3)'}}>{b.group_number}</div>
                        </td>
                        <td style={{fontSize:11}}>
                          <div>{b.company_name||'—'}</div>
                          {b.agent_name && <div style={{fontSize:9,color:'var(--text3)'}}>{b.agent_name}</div>}
                        </td>
                        <td><span className="badge bg-gray">{b.nationality||'—'}</span></td>
                        <td style={{textAlign:'center'}}>
                          <span className="badge bg-teal">{b.passenger_count}</span>
                        </td>
                        <td style={{fontSize:10}}>
                          {b.template_type
                            ? <span className="badge bg-purple" style={{fontSize:9}}>{b.template_type}</span>
                            : <span style={{color:'var(--text3)'}}>—</span>}
                        </td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text2)'}}>{b.arrival_date||'—'}</td>
                        <td style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--text2)'}}>{b.departure_date||'—'}</td>
                        <td style={{textAlign:'center'}}>
                          <span className="badge bg-gray">{b.movements_count||0}</span>
                        </td>
                        <td>
                          <span className={`badge ${STS_CLS[b.status]||'bg-gray'}`}>{b.status}</span>
                        </td>
                        {/* ▼▼▼  بداية التعديل: أزرار العمليات مع زر الطباعة  ▼▼▼ */}
                        <td>
                          <div style={{display:'flex', gap:5}}>
                            {/* زر الطباعة الجديد */}
                            <button className="btn btn-ghost btn-sm"
                              style={{color: 'var(--purple)'}} 
                              onClick={() => navigate(`/print/booking/${b.id}`)}>
                              ⎙ طباعة
                            </button>

                            <button className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/bookings/${b.id}`)}>تعديل</button>
                              
                            <button className="btn btn-danger btn-sm"
                              onClick={() => del(b.id, b.guest_name||b.group_name)}>حذف</button>
                          </div>
                        </td>
                        {/* ▲▲▲  نهاية التعديل  ▲▲▲ */}
                      </tr>
                    ))}
                  </tbody>
                </table>}
          </div>
        </div>
      </div>
    </div>
  );
}