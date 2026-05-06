import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label, active }) => (
  <Link
    to={to}
    style={{
      display:'flex',
      alignItems:'center',
      gap:'12px',
      padding:'10px 16px',
      borderRadius:'10px',
      textDecoration:'none',
      fontSize:'14px',
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--text)' : 'var(--muted)',
      background: active ? 'rgba(108,99,255,0.15)' : 'transparent',
      transition:'all 0.2s',
      marginBottom:'4px',
    }}
  >
    <span style={{ fontSize:'18px' }}>{icon}</span>
    {label}
  </Link>
);

export default function Sidebar({ role }) {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  const adminLinks = [
    { to:'/admin/dashboard', icon:'📊', label:'Dashboard' },
    { to:'/admin/employees', icon:'👥', label:'Employee' },
    { to:'/admin/projects', icon:'📋', label:'Projects' },
    { to:'/admin/tasks', icon:'🗂️', label:'Tasks' },
    { to:'/admin/attendance', icon:'📅', label:'Attendance' },
    { to:'/admin/all-data', icon:'DB', label:'All Data' },
  ];

  const managerLinks = [
    { to:'/manager', icon:'📊', label:'Dashboard' },
    { to:'/manager/team', icon:'👥', label:'Employee' },
    { to:'/manager/projects', icon:'📋', label:'Projects' },
    { to:'/manager/tasks', icon:'🗂️', label:'Tasks' },
    { to:'/manager/attendance', icon:'📅', label:'Attendance' },
  ];

  const employeeLinks = [
    { to:'/employee', icon:'📊', label:'Dashboard' },
    { to:'/employee/activity', icon:'⏱️', label:'My Activity' },
    { to:'/employee/projects', icon:'📋', label:'Projects' },
    { to:'/employee/tasks', icon:'🗂️', label:'Tasks' },
    { to:'/employee/attendance', icon:'📅', label:'Attendance' },
    { to:'/employee/privacy', icon:'🔒', label:'Privacy' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'manager' ? managerLinks : employeeLinks;

  return (
    <div style={{ width:'240px', minHeight:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'24px 16px', flexShrink:0 }}>
      <div style={{ marginBottom:'32px', paddingLeft:'8px' }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:'20px', fontWeight:800 }} className="grad-text">WorkPulse</h1>
      </div>

      <nav style={{ flex:1 }}>
        {links.map((link) => <NavItem key={link.to} {...link} active={pathname === link.to} />)}
      </nav>

      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'16px', marginTop:'16px' }}>
        <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', textDecoration:'none' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(108,99,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'var(--accent1)' }}>
            {user?.name?.[0]}
          </div>
          <div>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>{user?.name}</p>
            <p style={{ fontSize:'11px', color:'var(--muted)' }}>{user?.department}</p>
          </div>
        </Link>
        <button onClick={logout} className="btn-ghost" style={{ width:'100%', padding:'8px', fontSize:'13px' }}>Sign Out</button>
      </div>
    </div>
  );
}
