import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './index.css';
import Dashboard      from './pages/Dashboard';
import Schedule       from './pages/Schedule';
import BookingForm    from './pages/BookingForm';
import Bookings       from './pages/Bookings';
import Drivers        from './pages/Drivers';
import Vehicles       from './pages/Vehicles';
import Suppliers      from './pages/Suppliers';
import Accounts       from './pages/Accounts';
import PrintSchedule  from './pages/print/PrintSchedule';
import PrintAccounts  from './pages/print/PrintAccounts';
import PrintBooking   from './pages/print/PrintBooking';
import AutoAssign     from './pages/AutoAssign';         // ✅ الإضافة الجديدة

const NAV = [
  { section: 'التشغيل', items: [
    { to: '/',            icon: '⊞', label: 'الرئيسية'      },
    { to: '/schedule',    icon: '≡', label: 'جدول التحركات' },
    { to: '/bookings',    icon: '◻', label: 'الحجوزات'       },
    { to: '/auto-assign', icon: '⚙', label: 'توزيع تلقائي'  },   // ✅ رابط جديد
  ]},
  { section: 'الأسطول', items: [
    { to: '/drivers',   icon: '◉', label: 'السائقون'       },
    { to: '/vehicles',  icon: '▣', label: 'الباصات'        },
    { to: '/suppliers', icon: '◈', label: 'الموردون'       },
  ]},
  { section: 'المالية', items: [
    { to: '/accounts',  icon: '＄', label: 'الحسابات'      },
  ]},
  { section: 'الطباعة', items: [
    { to: '/print/schedule', icon: '⎙', label: 'طباعة التحركات'  },
    { to: '/print/accounts', icon: '⎙', label: 'كشف الحسابات'   },
  ]},
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🕋 نقل العمرة</h1>
        <p>{new Date().toLocaleDateString('ar-SA',{weekday:'long',day:'numeric',month:'long'})}</p>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(sec => (
          <div key={sec.section}>
            <div className="nav-section">{sec.section}</div>
            {sec.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to.startsWith('/print/')}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Layout() {
  const loc = useLocation();
  const isPrint = loc.pathname.startsWith('/print');

  if (isPrint) return (
    <Routes>
      <Route path="/print/schedule"    element={<PrintSchedule />} />
      <Route path="/print/accounts"    element={<PrintAccounts />} />
      <Route path="/print/booking/:id" element={<PrintBooking />} />  {/* موجود مسبقاً */}
    </Routes>
  );

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/"                element={<Dashboard />}   />
          <Route path="/schedule"        element={<Schedule />}    />
          <Route path="/bookings"        element={<Bookings />}    />
          <Route path="/bookings/new"    element={<BookingForm />} />
          <Route path="/bookings/:id"    element={<BookingForm />} />
          <Route path="/drivers"         element={<Drivers />}     />
          <Route path="/vehicles"        element={<Vehicles />}    />
          <Route path="/suppliers"       element={<Suppliers />}   />
          <Route path="/accounts"        element={<Accounts />}    />
          <Route path="/auto-assign"     element={<AutoAssign />}  />   {/* ✅ مسار جديد */}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Layout /></BrowserRouter>;
}
