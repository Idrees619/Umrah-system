import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API = 'https://umrah-system-backend.onrender.com/api';

const TYPE_MAP = {'وصول':'arrival','تنقل':'transfer','مزارات':'visit','مغادرة':'departure'};
const TYPE_LABEL = {'وصول':'Arrival','تنقل':'Transfer','مزارات':'Ziyarat','مغادرة':'Departure'};

export default function PrintBooking() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`${API}/bookings/${id}`).then(r=>r.json())
        .then(j => setBooking(j.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div style={{padding:30,textAlign:'center',fontFamily:'sans-serif'}}>⏳ جاري التحميل...</div>;
  if (!booking) return <div style={{padding:30,textAlign:'center',color:'red'}}>الحجز غير موجود</div>;

  const fmtDate = (str) => {
    if (!str) return '—';
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return str; }
  };

  const now = new Date().toLocaleString('ar-SA');
  const movements = booking.movements || [];

  const TYPE_CSS_MAP = {
    'وصول':   'pt-arrival',
    'تنقل':   'pt-transfer',
    'مزارات': 'pt-visit',
    'مغادرة': 'pt-departure',
  };

  return (
    <div className="print-wrap">
      {/* زر الطباعة */}
      <div className="print-controls no-print">
        <button className="pc-btn pc-gold" onClick={() => window.print()}>🖨 طباعة / إرسال كـ PDF</button>
        <button className="pc-btn pc-gray" onClick={() => window.history.back()}>← رجوع</button>
        <span style={{fontSize:11, color:'#000'}}>هذا التأكيد سيُرسل للوكيل كتأكيد باستلام الجدول</span>
      </div>

      <div className="print-page">
        {/* رأس الصفحة */}
        <div className="p-header">
          <div>
            <h1>🕋 نظام نقل العمرة</h1>
            <p>تأكيد استلام جدول الحجز</p>
          </div>
          <div className="p-header-left" style={{color:'#000'}}>
            <strong>Booking Confirmation</strong>
            رقم الحجز: #{booking.booking_number}<br/>
            تاريخ الإصدار: {now}
          </div>
        </div>

        {/* شريط العنوان */}
        <div className="p-title-bar">
          <h2>تأكيد جدول النقل — {booking.guest_name||booking.group_name}</h2>
          <span>#{booking.booking_number}</span>
        </div>

        {/* بيانات الحجز */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
          {/* بيانات المجموعة */}
          <div style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'10px 12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #c9a84c',paddingRight:7,marginBottom:8}}>
              بيانات المجموعة
            </div>
            {[
              {l:'اسم الضيف / المجموعة', v:booking.guest_name||booking.group_name||'—'},
              {l:'رقم المجموعة',          v:booking.group_number||'—'},
              {l:'الجنسية',              v:booking.nationality||'—'},
              {l:'عدد المعتمرين',        v:`${booking.passenger_count} فرد`},
              {l:'تاريخ الوصول',         v: fmtDate(booking.arrival_date)},
              {l:'تاريخ المغادرة',       v: fmtDate(booking.departure_date)},
              {l:'خط السير',             v:booking.template_type||'مخصص'},
              {l:'الحالة',               v:booking.status},
            ].map(x=>(
              <div key={x.l} style={{display:'flex',marginBottom:4,fontSize:9}}>
                <span style={{color:'#000', minWidth:110}}>{x.l}:</span>
                <span style={{fontWeight:600, color:'#000'}}>{x.v}</span>
              </div>
            ))}
          </div>

          {/* بيانات الوكيل */}
          <div style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'10px 12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #2dd4bf',paddingRight:7,marginBottom:8}}>
              بيانات الوكيل / الشركة
            </div>
            {[
              {l:'اسم الشركة / الناقل',  v:booking.company_name||'—'},
              {l:'اسم الوكيل',            v:booking.agent_name||'—'},
              {l:'جوال الوكيل',           v:booking.agent_phone||'—'},
            ].map(x=>(
              <div key={x.l} style={{display:'flex',marginBottom:4,fontSize:9}}>
                <span style={{color:'#000', minWidth:110}}>{x.l}:</span>
                <span style={{fontWeight:600, color:'#000'}}>{x.v}</span>
              </div>
            ))}
            {booking.notes && (
              <div style={{marginTop:10,padding:'7px 9px',background:'#fafaf8',borderRadius:4,fontSize:8,color:'#000'}}>
                <strong>ملاحظات:</strong> {booking.notes}
              </div>
            )}
          </div>
        </div>

        {/* ملخص التحركات */}
        <div className="p-sum" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:12}}>
          {[
            {l:'إجمالي الخطوات',  v:movements.length,                                          acc:true},
            {l:'وصولات',  v:movements.filter(m=>m.movement_type==='وصول').length,              acc:false},
            {l:'تنقلات',  v:movements.filter(m=>m.movement_type==='تنقل').length,              acc:false},
            {l:'مغادرات', v:movements.filter(m=>m.movement_type==='مغادرة').length,            acc:false},
          ].map(s=>(
            <div key={s.l} className={`p-sum-card${s.acc?' acc':''}`}>
              <div className="sl">{s.l}</div>
              <div className="sv">{s.v}</div>
            </div>
          ))}
        </div>

        {/* جدول التحركات التفصيلي */}
        <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #c9a84c',paddingRight:7,margin:'0 0 8px'}}>
          جدول خطوات النقل التفصيلي
        </div>
        <table className="p-table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>الوقت</th>
              <th>نوع الحركة</th>
              <th>من (المدينة)</th>
              <th>إلى (المدينة)</th>
              <th>الفندق / الموقع من</th>
              <th>الفندق / الموقع إلى</th>
              <th>رقم الرحلة</th>
              <th>عدد الباصات</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m, i) => (
              <tr key={m.id||i} style={{borderRight:`2px solid ${
                m.movement_type==='وصول'?'#2dd4bf':
                m.movement_type==='تنقل'?'#a78bfa':
                m.movement_type==='مزارات'?'#fbbf24':'#fb7185'
              }`}}>
                <td style={{color:'#000'}}>{i+1}</td>
                <td style={{fontWeight:700,whiteSpace:'nowrap',color:'#000'}}>{fmtDate(m.movement_date)}</td>
                <td style={{fontWeight:700,color:'#c9a84c'}}>{(m.movement_time||'—').slice(0,5)}</td>
                <td>
                  <span className={`pt-arr ${TYPE_CSS_MAP[m.movement_type]||''}`}>
                    {m.movement_type}
                  </span>
                </td>
                <td style={{fontSize:8,fontWeight:600,color:'#000'}}>{m.from_city||'—'}</td>
                <td style={{fontSize:8,fontWeight:600,color:'#000'}}>{m.to_city||'—'}</td>
                <td style={{fontSize:8,color:'#000'}}>{m.from_location||'—'}</td>
                <td style={{fontSize:8,color:'#000'}}>{m.to_location||'—'}</td>
                <td style={{fontSize:8,color:'#000'}}>{m.flight_number||'—'}</td>
                <td style={{textAlign:'center',color:'#000'}}>{m.bus_count||1}</td>
                <td>
                  <span className={`pt-arr ${
                    m.status==='منتهي'?'sb-done':
                    m.status==='جاري'?'sb-active':'sb-pending'
                  }`}>{m.status||'مجدول'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movements.length === 0 && (
          <div style={{textAlign:'center',padding:20,color:'#000',fontSize:11}}>
            لا توجد خطوات مُدخلة بعد
          </div>
        )}

        {/* إشعار التأكيد */}
        <div style={{margin:'14px 0',padding:'10px 14px',background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:6,fontSize:9,color:'#000'}}>
          <strong>إشعار تأكيد:</strong> هذا المستند يُقرّ باستلام شركة نقل العمرة لجدول المجموعة المذكورة أعلاه وتأكيد تنفيذ خطوات النقل المُدرجة. أي تعديل على الجدول نرجو ابلاغنا به قبلها ب48 ساعة.
        </div>

        {/* توقيع */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginTop:16,paddingTop:12,borderTop:'1px solid #eee'}}>
          {['توقيع المشرف / المندوب','توقيع الوكيل / العميل','ختم الشركة'].map(s=>(
            <div key={s} style={{textAlign:'center'}}>
              <div style={{height:35,borderBottom:'1px solid #ccc',marginBottom:5}}/>
              <div style={{fontSize:8,color:'#000'}}>{s}</div>
            </div>
          ))}
        </div>

        <div className="p-footer">
          <span>نظام نقل العمرة — تأكيد الحجز</span>
          <span>#{booking.booking_number} — {booking.guest_name||booking.group_name}</span>
          <span>صدر بتاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
        </div>
      </div>
    </div>
  );
}
