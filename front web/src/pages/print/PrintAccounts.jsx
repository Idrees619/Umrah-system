import { useState, useEffect } from 'react';

const API = 'https://umrah-system-backend.onrender.com/api';

export default function PrintAccounts() {
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [accType,   setAccType]   = useState('all'); // all | drivers | suppliers
  const [drivers,   setDrivers]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [ready,     setReady]     = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today.slice(0,8)+'01');
    setDateTo(today);
  }, []);

  const filterByDate = (arr, field) => arr.filter(x => {
    const d = x[field];
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    return true;
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dr, sr] = await Promise.all([
        fetch(`${API}/drivers`).then(r=>r.json()),
        fetch(`${API}/suppliers`).then(r=>r.json()),
      ]);
      const drDetails = await Promise.all(
        (dr.data||[]).map(d => fetch(`${API}/drivers/${d.id}`).then(r=>r.json()).then(j=>j.data))
      );
      const srDetails = await Promise.all(
        (sr.data||[]).map(s => fetch(`${API}/suppliers/${s.id}`).then(r=>r.json()).then(j=>j.data))
      );
      setDrivers(drDetails.filter(Boolean));
      setSuppliers(srDetails.filter(Boolean));
      setReady(true);
    } finally { setLoading(false); }
  };

  const now    = new Date().toLocaleString('ar-SA');
  const period = dateFrom === dateTo ? dateFrom : `${dateFrom} — ${dateTo}`;

  const driversCalc = drivers.map(d => {
    const trips    = filterByDate(d.trips||[], 'movement_date');
    const payments = filterByDate(d.payments||[], 'payment_date');
    const earned   = trips.reduce((s,t)=>s+parseFloat(t.trip_amount||0),0);
    const paid     = payments.reduce((s,p)=>s+parseFloat(p.amount||0),0);
    return { ...d, fTrips:trips, fPayments:payments, earned, paid, balance:earned-paid };
  });

  const suppliersCalc = suppliers.map(s => {
    const trips    = filterByDate(s.trips||[], 'movement_date');
    const payments = filterByDate(s.payments||[], 'payment_date');
    const earned   = trips.reduce((sum,t)=>sum+parseFloat(t.trip_amount||0),0);
    const paid     = payments.reduce((sum,p)=>sum+parseFloat(p.amount||0),0);
    return { ...s, fTrips:trips, fPayments:payments, earned, paid, balance:earned-paid };
  });

  const grandDrEarned  = driversCalc.reduce((s,d)=>s+d.earned,0);
  const grandDrPaid    = driversCalc.reduce((s,d)=>s+d.paid,0);
  const grandDrBalance = grandDrEarned - grandDrPaid;
  const grandSpEarned  = suppliersCalc.reduce((s,x)=>s+x.earned,0);
  const grandSpPaid    = suppliersCalc.reduce((s,x)=>s+x.paid,0);
  const grandSpBalance = grandSpEarned - grandSpPaid;

  const showDrivers   = accType === 'all' || accType === 'drivers';
  const showSuppliers = accType === 'all' || accType === 'suppliers';

  return (
    <div className="print-wrap">
      {/* أدوات التحكم */}
      <div className="print-controls no-print">
        <span className="pc-lbl">من:</span>
        <input className="pc-inp" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
        <span className="pc-lbl">إلى:</span>
        <input className="pc-inp" type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}/>
        <select className="pc-sel" value={accType} onChange={e=>setAccType(e.target.value)}>
          <option value="all">السائقون + الموردون</option>
          <option value="drivers">السائقون فقط</option>
          <option value="suppliers">الموردون فقط</option>
        </select>
        <button className="pc-btn pc-dark" onClick={fetchAll} disabled={loading}>
          {loading?'جاري التحميل...':'🔍 عرض الكشف'}
        </button>
        {ready && (
          <button className="pc-btn pc-gold" onClick={()=>window.print()}>
            🖨 طباعة / PDF
          </button>
        )}
      </div>

      {ready && (
        <>
          {/* ── صفحة 1: ملخص إجمالي ── */}
          <div className="print-page">
            <div className="p-header">
              <div><h1>🕋 نظام نقل العمرة</h1><p>ملخص كشف الحسابات</p></div>
              <div className="p-header-left">
                <strong>كشف الحسابات الإجمالي</strong>
                الفترة: {period}<br/>طُبع: {now}
              </div>
            </div>

            <div className="p-title-bar">
              <h2>ملخص جميع الحسابات</h2>
              <span>{period}</span>
            </div>

            {/* إجمالي السائقين */}
            {showDrivers && (
              <>
                <div style={{fontSize:11,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #2dd4bf',paddingRight:8,margin:'12px 0 8px'}}>
                  السائقون الداخليون ({driversCalc.length})
                </div>
                <div className="p-sum" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:10}}>
                  {[
                    {l:'إجمالي التريبات',v:grandDrEarned.toFixed(0)+' ر.س',acc:false},
                    {l:'إجمالي المدفوع', v:grandDrPaid.toFixed(0)+' ر.س',  acc:false},
                    {l:'الرصيد المتبقي', v:grandDrBalance.toFixed(0)+' ر.س',acc:true},
                  ].map(s=>(
                    <div key={s.l} className={`p-sum-card${s.acc?' acc':''}`}>
                      <div className="sl">{s.l}</div>
                      <div className="sv" style={{fontSize:16}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>#</th><th>اسم الكابتن</th><th>الجوال</th><th>رقم الهوية</th>
                      <th>الرحلات</th><th>المستحق (ر.س)</th><th>المدفوع (ر.س)</th><th>المتبقي (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driversCalc.map((d,i)=>(
                      <tr key={d.id}>
                        <td style={{color:'#000'}}>{i+1}</td>
                        <td style={{fontWeight:700}}>{d.name}</td>
                        <td style={{fontSize:8}}>{d.phone}</td>
                        <td style={{fontSize:8,color:'#000'}}>{d.id_number||'—'}</td>
                        <td style={{textAlign:'center'}}>{d.fTrips.length}</td>
                        <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{d.earned.toFixed(0)}</td>
                        <td style={{fontWeight:700,color:'#15803d',textAlign:'left'}}>{d.paid.toFixed(0)}</td>
                        <td style={{fontWeight:700,color:d.balance>0?'#b91c1c':'#15803d',textAlign:'left'}}>{d.balance.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr style={{background:'#1a1a2e',color:'#fff',fontWeight:700}}>
                      <td colSpan={5} style={{color:'#fff',textAlign:'left',paddingRight:10}}>إجمالي السائقين</td>
                      <td style={{color:'#93c5fd',textAlign:'left'}}>{grandDrEarned.toFixed(0)}</td>
                      <td style={{color:'#86efac',textAlign:'left'}}>{grandDrPaid.toFixed(0)}</td>
                      <td style={{color:'#c9a84c',textAlign:'left'}}>{grandDrBalance.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* إجمالي الموردين */}
            {showSuppliers && (
              <>
                <div style={{fontSize:11,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #a78bfa',paddingRight:8,margin:'14px 0 8px'}}>
                  الموردون الخارجيون ({suppliersCalc.length})
                </div>
                <div className="p-sum" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:10}}>
                  {[
                    {l:'إجمالي المستحق',v:grandSpEarned.toFixed(0)+' ر.س',acc:false},
                    {l:'إجمالي المدفوع',v:grandSpPaid.toFixed(0)+' ر.س',  acc:false},
                    {l:'الرصيد المتبقي',v:grandSpBalance.toFixed(0)+' ر.س',acc:true},
                  ].map(s=>(
                    <div key={s.l} className={`p-sum-card${s.acc?' acc':''}`}>
                      <div className="sl">{s.l}</div>
                      <div className="sv" style={{fontSize:16}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>#</th><th>اسم الشركة</th><th>الجوال</th><th>الدولة</th>
                      <th>الرحلات</th><th>المستحق (ر.س)</th><th>المدفوع (ر.س)</th><th>المتبقي (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersCalc.map((s,i)=>(
                      <tr key={s.id}>
                        <td style={{color:'#000'}}>{i+1}</td>
                        <td style={{fontWeight:700}}>{s.name||s.supplier_name}</td>
                        <td style={{fontSize:8}}>{s.phone||'—'}</td>
                        <td style={{fontSize:8,color:'#000'}}>{s.country||'—'}</td>
                        <td style={{textAlign:'center'}}>{s.fTrips.length}</td>
                        <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{s.earned.toFixed(0)}</td>
                        <td style={{fontWeight:700,color:'#15803d',textAlign:'left'}}>{s.paid.toFixed(0)}</td>
                        <td style={{fontWeight:700,color:s.balance>0?'#b91c1c':'#15803d',textAlign:'left'}}>{s.balance.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr style={{background:'#1a1a2e',color:'#fff',fontWeight:700}}>
                      <td colSpan={5} style={{color:'#fff',textAlign:'left',paddingRight:10}}>إجمالي الموردين</td>
                      <td style={{color:'#93c5fd',textAlign:'left'}}>{grandSpEarned.toFixed(0)}</td>
                      <td style={{color:'#86efac',textAlign:'left'}}>{grandSpPaid.toFixed(0)}</td>
                      <td style={{color:'#c9a84c',textAlign:'left'}}>{grandSpBalance.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            <div className="p-footer">
              <span>نظام نقل العمرة — كشف الحسابات</span>
              <span>{period}</span>
              <span>السائقون: {grandDrBalance.toFixed(0)} — الموردون: {grandSpBalance.toFixed(0)} ر.س</span>
            </div>
          </div>

          {/* ── صفحة لكل سائق ── */}
          {showDrivers && driversCalc.filter(d=>d.fTrips.length>0).map(d => (
            <div className="print-page" key={d.id}>
              <div className="p-header">
                <div><h1>🕋 نظام نقل العمرة</h1><p>كشف حساب سائق</p></div>
                <div className="p-header-left">
                  <strong>{d.name}</strong>
                  📞 {d.phone}<br/>
                  🪪 {d.id_number||'—'}<br/>
                  الفترة: {period}<br/>طُبع: {now}
                </div>
              </div>
              <div className="p-title-bar">
                <h2>{d.name}</h2>
                <span>الرصيد المتبقي: {d.balance.toFixed(0)} ر.س</span>
              </div>
              <div className="p-sum" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                {[
                  {l:'الرحلات',     v:d.fTrips.length,         acc:false,   c:'#1a1a2e'},
                  {l:'إجمالي التريب',v:d.earned.toFixed(0)+' ر.س',acc:false,c:'#0369a1'},
                  {l:'المدفوع',     v:d.paid.toFixed(0)+' ر.س', acc:false,  c:'#15803d'},
                  {l:'المتبقي',     v:d.balance.toFixed(0)+' ر.س',acc:true, c:'#c9a84c'},
                ].map(s=>(
                  <div key={s.l} className={`p-sum-card${s.acc?' acc':''}`}>
                    <div className="sl">{s.l}</div>
                    <div className="sv" style={{fontSize:15,color:s.acc?'#c9a84c':s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #c9a84c',paddingRight:7,margin:'10px 0 7px'}}>تفاصيل الرحلات</div>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>#</th><th>التاريخ</th><th>الوقت</th><th>النوع</th>
                    <th>من</th><th>إلى</th><th>المجموعة</th><th>الشركة</th>
                    <th>مبلغ التريب</th><th>حالة الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {d.fTrips.map((t,i)=>(
                    <tr key={t.id}>
                      <td style={{color:'#000'}}>{i+1}</td>
                      <td style={{fontWeight:600}}>{t.movement_date}</td>
                      <td style={{color:'#c9a84c',fontWeight:700}}>{t.movement_time?.slice(0,5)||'—'}</td>
                      <td><span className={`pt-arr pt-${{'وصول':'arrival','تنقل':'transfer','مزارات':'visit','مغادرة':'departure'}[t.movement_type]||'transfer'}`}>{t.movement_type}</span></td>
                      <td style={{fontSize:8}}>{t.from_city}</td>
                      <td style={{fontSize:8}}>{t.to_city}</td>
                      <td style={{fontWeight:600,fontSize:8}}>{t.group_name||'—'}</td>
                      <td style={{fontSize:8,color:'#000'}}>{t.company_name||'—'}</td>
                      <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{parseFloat(t.trip_amount||0).toFixed(0)} ر.س</td>
                      <td><span className={`pt-arr ${t.payment_status==='مدفوع'?'sb-done':'sb-pending'}`}>{t.payment_status||'غير مدفوع'}</span></td>
                    </tr>
                  ))}
                  <tr style={{background:'#f5f5f0',fontWeight:700}}>
                    <td colSpan={8} style={{textAlign:'left',paddingRight:10}}>الإجمالي</td>
                    <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{d.earned.toFixed(0)} ر.س</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              {d.fPayments.length > 0 && (
                <>
                  <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #15803d',paddingRight:7,margin:'10px 0 7px'}}>سجل المدفوعات</div>
                  <table className="p-table">
                    <thead><tr><th>#</th><th>التاريخ</th><th>الطريقة</th><th>ملاحظة</th><th>المبلغ</th></tr></thead>
                    <tbody>
                      {d.fPayments.map((p,i)=>(
                        <tr key={p.id}>
                          <td style={{color:'#000'}}>{i+1}</td>
                          <td style={{fontWeight:600}}>{p.payment_date}</td>
                          <td>{p.payment_method}</td>
                          <td style={{fontSize:8,color:'#000'}}>{p.notes||'—'}</td>
                          <td style={{fontWeight:700,color:'#15803d',textAlign:'left'}}>{parseFloat(p.amount).toFixed(0)} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {/* توقيع */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginTop:18,paddingTop:12,borderTop:'1px solid #eee'}}>
                {['توقيع الكابتن','اعتماد المشرف','ختم الشركة'].map(s=>(
                  <div key={s} style={{textAlign:'center'}}>
                    <div style={{height:30,borderBottom:'1px solid #ccc',marginBottom:5}}/>
                    <div style={{fontSize:8,color:'#888'}}>{s}</div>
                  </div>
                ))}
              </div>
              <div className="p-footer">
                <span>نظام نقل العمرة</span>
                <span>{d.name} — {period}</span>
                <span>المتبقي: {d.balance.toFixed(0)} ر.س</span>
              </div>
            </div>
          ))}

          {/* ── صفحة لكل مورد ── */}
          {showSuppliers && suppliersCalc.filter(s=>s.fTrips.length>0).map(s => (
            <div className="print-page" key={s.id}>
              <div className="p-header">
                <div><h1>🕋 نظام نقل العمرة</h1><p>كشف حساب مورد</p></div>
                <div className="p-header-left">
                  <strong>{s.name||s.supplier_name}</strong>
                  📞 {s.phone||'—'}<br/>
                  {s.country&&<span>🌍 {s.country}<br/></span>}
                  الفترة: {period}<br/>طُبع: {now}
                </div>
              </div>
              <div className="p-title-bar">
                <h2>{s.name||s.supplier_name}</h2>
                <span>الرصيد المتبقي: {s.balance.toFixed(0)} ر.س</span>
              </div>
              <div className="p-sum" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                {[
                  {l:'الرحلات',     v:s.fTrips.length},
                  {l:'إجمالي المستحق',v:s.earned.toFixed(0)+' ر.س'},
                  {l:'المدفوع',     v:s.paid.toFixed(0)+' ر.س'},
                  {l:'المتبقي',     v:s.balance.toFixed(0)+' ر.س',acc:true},
                ].map(x=>(
                  <div key={x.l} className={`p-sum-card${x.acc?' acc':''}`}>
                    <div className="sl">{x.l}</div>
                    <div className="sv" style={{fontSize:15}}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,fontWeight:700,color:'#1a1a2e',borderRight:'3px solid #c9a84c',paddingRight:7,margin:'10px 0 7px'}}>تفاصيل الرحلات</div>
              <table className="p-table">
                <thead>
                  <tr><th>#</th><th>التاريخ</th><th>النوع</th><th>من</th><th>إلى</th><th>المجموعة</th><th>المبلغ</th><th>الدفع</th></tr>
                </thead>
                <tbody>
                  {s.fTrips.map((t,i)=>(
                    <tr key={t.id}>
                      <td style={{color:'#000'}}>{i+1}</td>
                      <td style={{fontWeight:600}}>{t.movement_date}</td>
                      <td><span className={`pt-arr pt-${{'وصول':'arrival','تنقل':'transfer','مزارات':'visit','مغادرة':'departure'}[t.movement_type]||'transfer'}`}>{t.movement_type}</span></td>
                      <td style={{fontSize:8}}>{t.from_city}</td>
                      <td style={{fontSize:8}}>{t.to_city}</td>
                      <td style={{fontWeight:600,fontSize:8}}>{t.group_name||'—'}</td>
                      <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{parseFloat(t.trip_amount||0).toFixed(0)} ر.س</td>
                      <td><span className={`pt-arr ${t.payment_status==='مدفوع'?'sb-done':'sb-pending'}`}>{t.payment_status||'غير مدفوع'}</span></td>
                    </tr>
                  ))}
                  <tr style={{background:'#f5f5f0',fontWeight:700}}>
                    <td colSpan={6} style={{textAlign:'left',paddingRight:10}}>الإجمالي</td>
                    <td style={{fontWeight:700,color:'#0369a1',textAlign:'left'}}>{s.earned.toFixed(0)} ر.س</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div className="p-footer">
                <span>نظام نقل العمرة</span>
                <span>{s.name||s.supplier_name} — {period}</span>
                <span>المتبقي: {s.balance.toFixed(0)} ر.س</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
