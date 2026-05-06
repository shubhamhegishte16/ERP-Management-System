import { useEffect, useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import MemberModal from '../../components/dashboard/MemberModal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState('');

  const isAdmin = user?.role === 'admin';
  const canDeleteUser = (member) => isAdmin && member.role !== 'manager';

  useEffect(() => {
    api.get('/analytics/summary')
      .then((r) => {
        const users = r.data.summary.filter((item) => {
          if (isAdmin) return item.user.role === 'manager' || item.user.role === 'employee';
          return item.user.role === 'employee';
        });
        setSummary(users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const deleteUser = async (member) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(`Delete ${member.name}?`);
    if (!confirmed) return;

    setDeletingId(member._id);
    try {
      await api.delete(`/admin/users/${member._id}`);
      setSummary(current => current.filter(item => item.user._id !== member._id));
      if (selected?.user?._id === member._id) setSelected(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId('');
    }
  };

  const filtered = summary.filter((s) => {
    const matchSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) || (s.user.department || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'high' && s.productivity?.burnoutRisk === 'high') || (filter === 'anomaly' && s.productivity?.anomalyFlag);
    return matchSearch && matchFilter;
  });

  const pageSummary = isAdmin
    ? `${summary.length} people across managers and employees`
    : `${summary.length} registered employees`;

  if (loading) {
    return (
      <div style={{ display:'flex' }}>
        <Sidebar role={user?.role} />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
          <div className="spinner" style={{ width:'36px', height:'36px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>Employee</h2>
          <p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>{pageSummary}</p>
        </div>
        <div style={{ display:'flex', gap:'12px', marginBottom:'24px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or department..." style={{ flex:1, background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'8px', padding:'10px 14px', outline:'none', fontSize:'14px' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'8px', padding:'10px 14px', outline:'none', fontSize:'14px', cursor:'pointer' }}>
            <option value="all">All</option>
            <option value="high">High Burnout Risk</option>
            <option value="anomaly">Has Anomaly</option>
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px' }}>
          {filtered.map(({ user: member, productivity }, i) => (
            <div
              key={i}
              className="card"
              style={{ cursor:'pointer', transition:'transform 0.2s, border-color 0.2s' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div onClick={() => setSelected({ user: member, productivity })}>
                <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(108,99,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:800, color:'#6c63ff', flexShrink:0 }}>{member.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'15px', fontWeight:700, color:'#f0eeff' }}>{member.name}</p>
                    <p style={{ fontSize:'12px', color:'#7b7a99' }}>{member.department || 'No dept'}</p>
                  </div>
                  <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'999px', fontWeight:600, background:'rgba(108,99,255,0.12)', color:'#6c63ff' }}>{member.role}</span>
                </div>
                <div style={{ marginBottom:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'12px', color:'#7b7a99' }}>Productivity</span>
                    <span style={{ fontSize:'14px', fontWeight:800, color:(productivity?.score || 0) >= 75 ? '#00d9a3' : (productivity?.score || 0) >= 50 ? '#6c63ff' : '#ff5c87' }}>{productivity?.score ?? '-'}</span>
                  </div>
                  <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px' }}>
                    <div style={{ width:`${productivity?.score || 0}%`, height:'100%', background:'linear-gradient(90deg,#6c63ff,#00d9a3)', borderRadius:'2px' }} />
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'999px', fontWeight:600, background:productivity?.burnoutRisk === 'high' ? 'rgba(255,92,135,0.15)' : productivity?.burnoutRisk === 'medium' ? 'rgba(255,179,71,0.15)' : 'rgba(0,217,163,0.15)', color:productivity?.burnoutRisk === 'high' ? '#ff5c87' : productivity?.burnoutRisk === 'medium' ? '#ffb347' : '#00d9a3' }}>{productivity?.burnoutRisk || 'low'} risk</span>
                  {productivity?.anomalyFlag && <span style={{ fontSize:'11px', color:'#ffb347' }}>Warning</span>}
                  <span style={{ fontSize:'12px', color:'#6c63ff' }}>View details -&gt;</span>
                </div>
              </div>
              {canDeleteUser(member) && (
                <button
                  onClick={() => deleteUser(member)}
                  disabled={deletingId === member._id}
                  style={{ marginTop:'14px', width:'100%', background:'rgba(255,92,135,0.15)', border:'1px solid rgba(255,92,135,0.35)', color:'#ff5c87', borderRadius:'8px', padding:'10px 12px', cursor:'pointer', fontWeight:600 }}
                >
                  {deletingId === member._id ? 'Deleting...' : 'Delete User'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="card" style={{ textAlign:'center', padding:'40px', color:'#7b7a99', gridColumn:'1/-1' }}>No employees found.</div>}
        </div>
      </main>
      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
