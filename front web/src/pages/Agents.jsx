import { useState, useEffect } from 'react';

const API = 'https://umrah-system-backend.onrender.com/api';
function AgentModal({ agent, onClose, onSaved }) {
  const isEdit = !!agent;
  const [f, setF] = useState({
    name:        agent?.name        || '',
    phone:       agent?.phone       || '',
    company:     agent?.company     || '',
    nationality: agent?.nationality || '',
    notes:       agent?.notes       || '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const save = async () => {
    if (!f.name) { setErr('الاسم مطلوب'); return; }
    setSaving(true); setErr('');
    try {
      const opts = { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) };
      const url  = isEdit ? `${API}/agents/${agent.id}` : `${API}/agents`;
      const r    = await fetch(url, opts);
      const j    = await r.json();
      if (!j.success) throw new Error(j.error);
      onSaved();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box fade-in" style={{ maxWidth: 440 }}>
        <div className="modal-hdr">
          <span style={{ fontWeight: 700 }}>{isEdit ? 'تعديل وكيل' : 'إضافة وكيل جديد'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="err-box">{err}</div>}
          <div className="fg2" style={{ marginBottom: 10 }}>
            <div className="fg">
              <label className="fl">اسم الوكيل *</label>
              <input type="text" placeholder="الاسم الكامل" value={f.name}
                onChange={e => setF(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">الجوال</label>
              <input type="text" placeholder="+966 5x xxx xxxx" value={f.phone}
                onChange={e => setF(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="fg2" style={{ marginBottom: 10 }}>
            <div className="fg">
              <label className="fl">الشركة / الوكالة</label>
              <input type="text" placeholder="اسم الشركة" value={f.company}
                onChange={e => setF(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">الجنسية</label>
              <input type="text" placeholder="مصري / مغربي..." value={f.nationality}
                onChange={e => setF(p => ({ ...p, nationality: e.target.value }))} />
            </div>
          </div>
          <div className="fg">
            <label className="fl">ملاحظات</label>
            <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية..." style={{ minHeight: 50 }} />
          </div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'جاري...' : isEdit ? 'حفظ التعديلات' : '+ إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agents() {
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/agents`);
      const j = await r.json();
      setAgents(j.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id, name) => {
    if (!window.confirm(`حذف الوكيل "${name}"؟`)) return;
    await fetch(`${API}/agents/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = agents.filter(a =>
    !search ||
    (a.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.company||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.phone||'').includes(search)
  );

  return (
    <div className="fade-in">
      <div className="page-hdr">
        <div>
          <div className="page-title">الوكلاء</div>
          <div className="page-sub">{agents.length} وكيل مسجل</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>+ إضافة وكيل</button>
      </div>

      <div className="page-body">
        {/* إحصائيات */}
        <div className="stat-grid stat-grid-3" style={{ marginBottom: 16 }}>
          <div className="stat-card gold">
            <div className="s-label">إجمالي الوكلاء</div>
            <div className="s-val">{agents.length}</div>
          </div>
          <div className="stat-card teal">
            <div className="s-label">جنسيات مختلفة</div>
            <div className="s-val">{new Set(agents.map(a => a.nationality).filter(Boolean)).size}</div>
          </div>
          <div className="stat-card purple">
            <div className="s-label">شركات مختلفة</div>
            <div className="s-val">{new Set(agents.map(a => a.company).filter(Boolean)).size}</div>
          </div>
        </div>

        {/* بحث */}
        <div style={{ marginBottom: 10 }}>
          <input type="text" placeholder="🔍 بحث بالاسم أو الشركة أو الجوال..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? <div className="loading">⏳ جاري التحميل...</div>
            : filtered.length === 0
              ? <div className="empty">
                  {search ? 'لا توجد نتائج' : 'لا يوجد وكلاء بعد'}
                  {!search && (
                    <div style={{ marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'add' })}>+ أضف أول وكيل</button>
                    </div>
                  )}
                </div>
              : <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم الوكيل</th>
                      <th>الجوال</th>
                      <th>الشركة / الوكالة</th>
                      <th>الجنسية</th>
                      <th>ملاحظات</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text3)', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</td>
                        <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text2)' }}>
                          {a.phone || '—'}
                        </td>
                        <td style={{ fontSize: 12 }}>{a.company || '—'}</td>
                        <td>
                          {a.nationality
                            ? <span className="badge bg-gray">{a.nationality}</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                          {a.notes ? a.notes.slice(0, 40) + (a.notes.length > 40 ? '...' : '') : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => setModal({ type: 'edit', agent: a })}>تعديل</button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => del(a.id, a.name)}>حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
          </div>
        </div>
      </div>

      {modal?.type === 'add'  && <AgentModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'edit' && <AgentModal agent={modal.agent} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}
