import { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Sidebar from '../../components/dashboard/Sidebar';
import KPICard from '../../components/dashboard/KPICard';
import TracingToggle from '../../components/dashboard/TracingToggle';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [productivity, setProductivity] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, a] = await Promise.all([
          api.get('/analytics/me?days=7'),
          api.get('/activity/me'),
        ]);
        setProductivity(p.data.records);
        setActivities(a.data.activities);
        setActivitySummary(a.data.summary);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayRecord = productivity[productivity.length - 1];
  const todayScore = todayRecord?.score ?? 0;
  const activeHours = todayRecord ? (todayRecord.totalActiveSeconds / 3600).toFixed(1) : '0';

  const lineData = {
    labels: productivity.map(p => new Date(p.date).toLocaleDateString('en-IN', { weekday:'short' })),
    datasets: [{
      label: 'Productivity Score',
      data: productivity.map(p => p.score),
      borderColor: '#6c63ff',
      backgroundColor: 'rgba(108,99,255,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6c63ff',
    }],
  };

  const topApps = (activitySummary?.topApps || []).map(({ appName, durationSeconds }) => [appName, durationSeconds]);
  const doughnutData = {
    labels: topApps.map(([name]) => name),
    datasets: [{
      data: topApps.map(([, secs]) => Math.round(secs / 60)),
      backgroundColor: ['#6c63ff','#ff5c87','#00d9a3','#ffb347','#a89dff'],
      borderWidth: 0,
    }],
  };

  if (loading) {
    return (
      <div style={{ display:'flex' }}>
        <Sidebar role="employee" />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
          <div className="spinner" style={{ width:'36px', height:'36px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role="employee" />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
          <div>
            <h2 style={{ fontFamily:'Syne', fontSize:'26px', fontWeight:800 }}>Good day, {user?.name?.split(' ')[0]} 👋</h2>
            <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'4px' }}>Here's your productivity summary</p>
          </div>
          <TracingToggle storageKey={`wp_tracing_${user?._id || 'employee'}`} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
          <KPICard label="Today's Score" value={`${todayScore}/100`} change="Your productivity rating" color="var(--accent1)" />
          <KPICard label="Active Hours" value={`${activeHours}h`} change="Time in focus" color="var(--accent3)" />
          <KPICard label="Apps Used" value={activitySummary?.trackedAppCount || topApps.length} change="Today" color="var(--accent4)" changeType="neutral" />
          <KPICard label="Burnout Risk" value={todayRecord?.burnoutRisk ?? 'low'} change="Based on your hours" color={todayRecord?.burnoutRisk === 'high' ? 'var(--accent2)' : 'var(--accent3)'} changeType={todayRecord?.burnoutRisk === 'high' ? 'down' : 'up'} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'24px' }}>
          <div className="card">
            <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>Productivity - Last 7 Days</p>
            {productivity.length > 0
              ? <Line data={lineData} options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#7b7a99' }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#7b7a99' }, grid:{ color:'rgba(255,255,255,0.04)' }, min:0, max:100 } } }} height={80} />
              : <p style={{ color:'var(--muted)', fontSize:'14px', textAlign:'center', padding:'40px 0' }}>No data yet. Start working to see your trend!</p>}
          </div>
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px', alignSelf:'flex-start' }}>App Usage Today</p>
            {topApps.length > 0
              ? <Doughnut data={doughnutData} options={{ plugins:{ legend:{ position:'bottom', labels:{ color:'#7b7a99', padding:12 } } }, cutout:'70%' }} />
              : <p style={{ color:'var(--muted)', fontSize:'14px', textAlign:'center', padding:'40px 0' }}>No app activity recorded today</p>}
          </div>
        </div>

        <div className="card">
          <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px' }}>Today's Activity Log</p>
          {activities.length === 0
            ? <p style={{ color:'var(--muted)', fontSize:'14px' }}>No activities logged today. Is the desktop app running?</p>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {activities.slice(0,10).map((a, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', background:'var(--surface2)', borderRadius:'8px' }}>
                    <span style={{ fontSize:'16px' }}>{a.category === 'coding' ? '💻' : a.category === 'browsing' ? '🌐' : a.category === 'communication' ? '💬' : a.category === 'docs' ? '📄' : a.category === 'idle' ? '💤' : '📱'}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:600 }}>{a.isPrivate ? '[Private]' : a.appName}</p>
                      <p style={{ fontSize:'11px', color:'var(--muted)' }}>{a.category} - {Math.round(a.durationSeconds/60)} min</p>
                    </div>
                    <span style={{ fontSize:'11px', color:'var(--muted)' }}>{new Date(a.date).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
