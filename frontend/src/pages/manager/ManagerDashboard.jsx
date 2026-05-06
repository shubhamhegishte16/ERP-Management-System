import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from '../../components/dashboard/Sidebar';
import KPICard from '../../components/dashboard/KPICard';
import TracingToggle from '../../components/dashboard/TracingToggle';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const chartDefaults = {
  plugins: { legend: { labels: { color: '#7b7a99', font: { family: 'DM Sans' } } } },
  scales: {
    x: { ticks: { color: '#7b7a99' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { 
      min: 0,
      max: 100,
      ticks: { color: '#7b7a99' }, 
      grid: { color: 'rgba(255,255,255,0.04)' } 
    },
  },
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [teamProd, setTeamProd] = useState({ records:[], burnoutAlerts:[], anomalies:[] });
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/team'),
        ]);
        setSummary(s.data.summary);
        setTeamProd(t.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeCount = summary.filter(s => s.productivity?.score > 0).length;
  const avgScore = summary.length ? Math.round(summary.reduce((a, s) => a + (s.productivity?.score || 0), 0) / summary.length) : 0;
  const burnoutHigh = teamProd.burnoutAlerts.filter(a => a.burnoutRisk === 'high').length;

  const barData = {
    labels: summary.map(s => s.user.name.split(' ')[0]),
    datasets: [{
      label: 'Productivity Score',
      data: summary.map(s => s.productivity?.score || 0),
      backgroundColor: summary.map(s => {
        const score = s.productivity?.score || 0;
        return score >= 75 ? 'rgba(0,217,163,0.7)' : score >= 50 ? 'rgba(108,99,255,0.7)' : 'rgba(255,92,135,0.7)';
      }),
      borderRadius: 6,
    }],
  };

  if (loading) {
    return (
      <div style={{ display:'flex' }}>
        <Sidebar role={user?.role || 'manager'} />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
          <div className="spinner" style={{ width:'36px', height:'36px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role || 'manager'} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
          <div>
            <h2 style={{ fontFamily:'Syne', fontSize:'26px', fontWeight:800 }}>{isAdmin ? 'Admin Dashboard' : 'Manager Dashboard'}</h2>
            <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'4px' }}>Live team overview - {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</p>
          </div>
          <TracingToggle storageKey={isAdmin ? 'wp_tracing_admin' : 'wp_tracing_manager'} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
          <KPICard label="Active Today" value={`${activeCount} / ${summary.length}`} change="Tracking live" color="var(--accent3)" />
          <KPICard label="Avg Productivity" value={`${avgScore}%`} change="+5% vs yesterday" color="var(--accent1)" />
          <KPICard label="Burnout Risk" value={`${burnoutHigh} High`} change="Review immediately" color="var(--accent2)" changeType="down" />
          <KPICard label={isAdmin ? 'Registered Users' : 'Anomalies'} value={isAdmin ? summary.length : teamProd.anomalies.length} change={isAdmin ? 'Managers and employees' : 'Today'} color="var(--accent4)" changeType="neutral" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'16px', marginBottom:'24px' }}>
          <div className="card">
            <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>Team Productivity Scores</p>
            <Bar data={barData} options={{ ...chartDefaults, responsive: true, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} height={90} />
          </div>
        </div>

        <div className="card">
          <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>{isAdmin ? 'Managers and Employees' : 'Team Members'}</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Name','Department','Role','Score','Burnout Risk','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:'11px', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(({ user: member, productivity: p }, i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'12px', fontSize:'14px', fontWeight:600 }}>{member.name}</td>
                  <td style={{ padding:'12px', fontSize:'13px', color:'var(--muted)' }}>{member.department || '-'}</td>
                  <td style={{ padding:'12px' }}><span style={{ fontSize:'11px', background:'rgba(108,99,255,0.15)', color:'var(--accent1)', padding:'3px 10px', borderRadius:'999px', fontWeight:600 }}>{member.role}</span></td>
                  <td style={{ padding:'12px' }}><span style={{ fontFamily:'Syne', fontWeight:800, color: (p?.score || 0) >= 75 ? 'var(--accent3)' : (p?.score || 0) >= 50 ? 'var(--accent1)' : 'var(--accent2)' }}>{p?.score ?? '-'}</span></td>
                  <td style={{ padding:'12px' }}>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'999px', fontWeight:600, background: p?.burnoutRisk === 'high' ? 'rgba(255,92,135,0.15)' : p?.burnoutRisk === 'medium' ? 'rgba(255,179,71,0.15)' : 'rgba(0,217,163,0.15)', color: p?.burnoutRisk === 'high' ? 'var(--accent2)' : p?.burnoutRisk === 'medium' ? 'var(--accent4)' : 'var(--accent3)' }}>
                      {p?.burnoutRisk ?? 'low'}
                    </span>
                  </td>
                  <td style={{ padding:'12px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px', color: p ? 'var(--accent3)' : 'var(--muted)' }}>
                      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: p ? 'var(--accent3)' : 'var(--muted)', display:'inline-block' }} />
                      {p ? 'Active' : 'No data'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
