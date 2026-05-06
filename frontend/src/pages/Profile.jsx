import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    role: user?.role || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  const avatarColors = ['#6c63ff','#ff5c87','#00d9a3','#ffb347','#a89dff'];
  const avatarColor = avatarColors[user?.name?.charCodeAt(0) % avatarColors.length] || '#6c63ff';

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { name: form.name, department: form.department });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return setError('Passwords do not match!');
    try {
      await api.put('/auth/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPwSaved(true);
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  const inp = { background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'8px', padding:'10px 14px', width:'100%', outline:'none', fontSize:'14px' };
  const lbl = { fontSize:'12px', color:'#7b7a99', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' };
  const tabStyle = (t) => ({ padding:'10px 24px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'14px', background: tab===t ? 'rgba(108,99,255,0.2)' : 'transparent', color: tab===t ? '#6c63ff' : '#7b7a99', transition:'all 0.2s' });

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>My Profile</h2>
          <p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>Manage your account settings</p>
        </div>

        {/* Avatar card */}
        <div className="card" style={{ display:'flex', alignItems:'center', gap:'24px', marginBottom:'24px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:`linear-gradient(135deg, ${avatarColor}, #ff5c87)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', fontWeight:800, color:'white', flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize:'22px', fontWeight:800, color:'#f0eeff', marginBottom:'4px' }}>{user?.name}</p>
            <p style={{ fontSize:'14px', color:'#7b7a99', marginBottom:'8px' }}>{user?.email}</p>
            <div style={{ display:'flex', gap:'8px' }}>
              <span style={{ fontSize:'11px', padding:'3px 12px', borderRadius:'999px', background:'rgba(108,99,255,0.15)', color:'#6c63ff', fontWeight:600 }}>{user?.role}</span>
              <span style={{ fontSize:'11px', padding:'3px 12px', borderRadius:'999px', background:'rgba(0,217,163,0.15)', color:'#00d9a3', fontWeight:600 }}>{user?.department || 'No department'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'24px', background:'#12121a', padding:'4px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.08)', width:'fit-content' }}>
          <button style={tabStyle('profile')} onClick={()=>setTab('profile')}>👤 Profile Info</button>
          <button style={tabStyle('password')} onClick={()=>setTab('password')}>🔒 Password</button>
          <button style={tabStyle('stats')} onClick={()=>setTab('stats')}>📊 My Stats</button>
        </div>

        {error && <div style={{ background:'rgba(255,92,135,0.1)', border:'1px solid rgba(255,92,135,0.3)', borderRadius:'8px', padding:'12px', marginBottom:'16px', fontSize:'14px', color:'#ff5c87' }}>{error}</div>}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card" style={{ maxWidth:'560px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:700, color:'#f0eeff', marginBottom:'24px' }}>Personal Information</h3>
            <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div><label style={lbl}>Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp} /></div>
              <div><label style={lbl}>Email</label><input value={form.email} disabled style={{...inp, opacity:0.5, cursor:'not-allowed'}} /></div>
              <div><label style={lbl}>Department</label><input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="e.g. Engineering" style={inp} /></div>
              <div><label style={lbl}>Role</label><input value={form.role} disabled style={{...inp, opacity:0.5, cursor:'not-allowed'}} /></div>
              <button className="btn-primary" type="submit" style={{ padding:'12px', marginTop:'8px' }}>
                {saved ? '✅ Saved!' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="card" style={{ maxWidth:'560px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:700, color:'#f0eeff', marginBottom:'24px' }}>Change Password</h3>
            <form onSubmit={savePassword} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div><label style={lbl}>Current Password</label><input type="password" value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})} style={inp} required /></div>
              <div><label style={lbl}>New Password</label><input type="password" value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})} style={inp} required minLength={6} /></div>
              <div><label style={lbl}>Confirm New Password</label><input type="password" value={passwords.confirm} onChange={e=>setPasswords({...passwords,confirm:e.target.value})} style={inp} required /></div>
              <button className="btn-primary" type="submit" style={{ padding:'12px', marginTop:'8px' }}>
                {pwSaved ? '✅ Password Updated!' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', maxWidth:'700px' }}>
            {[
              { label:'Member Since', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month:'long', year:'numeric' }), color:'#6c63ff', icon:'📅' },
              { label:'Role', value: user?.role?.toUpperCase(), color:'#ff5c87', icon:'🎯' },
              { label:'Department', value: user?.department || 'Not set', color:'#00d9a3', icon:'🏢' },
              { label:'Account Status', value:'Active', color:'#00d9a3', icon:'✅' },
              { label:'Data Privacy', value:'GDPR OK', color:'#ffb347', icon:'🔒' },
              { label:'Login Method', value:'Email + JWT', color:'#a89dff', icon:'🔑' },
            ].map((s,i) => (
              <div key={i} className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:'28px', marginBottom:'10px' }}>{s.icon}</div>
                <p style={{ fontSize:'11px', color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>{s.label}</p>
                <p style={{ fontSize:'16px', fontWeight:800, color:s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
