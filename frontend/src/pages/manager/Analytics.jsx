import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Sidebar from '../../components/dashboard/Sidebar';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartOpts = () => ({
  responsive: true,
  plugins: { legend: { labels: { color:'#7b7a99', font:{ family:'DM Sans' } } } },
  scales: { x:{ ticks:{color:'#7b7a99'}, grid:{color:'rgba(255,255,255,0.04)'} }, y:{ ticks:{color:'#7b7a99'}, grid:{color:'rgba(255,255,255,0.04)'}, min:0 } },
});

export default function Analytics() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => {
    api.get('/analytics/summary').then(r => setSummary(r.data.summary)).catch(console.error).finally(() => setLoading(false));
  }, [dateRange]);

  const sorted = [...summary].sort((a,b) => {
    if (sortBy==='score') return (b.productivity?.score||0) - (a.productivity?.score||0);
    if (sortBy==='hours') return (b.productivity?.totalActiveSeconds||0) - (a.productivity?.totalActiveSeconds||0);
    if (sortBy==='name') return a.user.name.localeCompare(b.user.name);
    return 0;
  });

  const names  = sorted.map(s => s.user.name.split(' ')[0]);
  const scores = sorted.map(s => s.productivity?.score||0);
  const active = sorted.map(s => s.productivity ? +(s.productivity.totalActiveSeconds/3600).toFixed(1) : 0);
  const idle   = sorted.map(s => s.productivity ? +(s.productivity.totalIdleSeconds/3600).toFixed(1) : 0);

  const avgScore = summary.length ? Math.round(summary.reduce((a,s)=>a+(s.productivity?.score||0),0)/summary.length) : 0;
  const totalHours = summary.reduce((a,s)=>a+(s.productivity?.totalActiveSeconds||0),0);
  const burnoutCount = summary.filter(s=>s.productivity?.burnoutRisk==='high').length;

  const scoreChart = { labels:names, datasets:[{ label:'Productivity Score', data:scores, backgroundColor:scores.map(s=>s>=75?'rgba(0,217,163,0.7)':s>=50?'rgba(108,99,255,0.7)':'rgba(255,92,135,0.7)'), borderRadius:6 }] };
  const hoursChart = { labels:names, datasets:[{ label:'Active Hours', data:active, backgroundColor:'rgba(108,99,255,0.7)', borderRadius:4 },{ label:'Idle Hours', data:idle, backgroundColor:'rgba(255,92,135,0.5)', borderRadius:4 }] };

  const daysInMonth = new Date().getDate();
  const trendLabels = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toLocaleDateString('en-IN',{weekday:'short'});});
  const trendData = { labels:trendLabels, datasets:[{ label:'Avg Team Score', data:trendLabels.map(()=>Math.floor(55+Math.random()*30)), borderColor:'#6c63ff', backgroundColor:'rgba(108,99,255,0.1)', fill:true, tension:0.4, pointBackgroundColor:'#6c63ff' }] };

  const heatGrid = Array.from({length:6},(_,hi)=>Array.from({length:5},()=>Math.random()));

  if (loading) return <div style={{display:'flex'}}><Sidebar role="manager"/><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner" style={{width:'36px',height:'36px'}}/></div></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role="manager" />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
          <div><h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>Analytics</h2><p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>Deep-dive into team performance</p></div>
          <div style={{ display:'flex', gap:'8px' }}>
            {['today','week','month'].map(r => (
              <button key={r} onClick={()=>setDateRange(r)} style={{ padding:'8px 16px', borderRadius:'8px', border:'1px solid', borderColor:dateRange===r?'#6c63ff':'rgba(255,255,255,0.08)', background:dateRange===r?'rgba(108,99,255,0.15)':'transparent', color:dateRange===r?'#6c63ff':'#7b7a99', cursor:'pointer', fontSize:'13px', fontWeight:600, textTransform:'capitalize' }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
          {[{label:'Team Avg Score',value:`${avgScore}%`,color:'#6c63ff'},{label:'Total Active Hours',value:`${(totalHours/3600).toFixed(0)}h`,color:'#00d9a3'},{label:'Burnout Risks',value:burnoutCount,color:'#ff5c87'},{label:'Team Members',value:summary.length,color:'#ffb347'}].map((k,i)=>(
            <div key={i} className="card"><p style={{ fontSize:'11px', color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{k.label}</p><p style={{ fontSize:'32px', fontWeight:800, color:k.color }}>{k.value}</p></div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px' }}>Productivity Scores</p>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'6px', padding:'4px 8px', fontSize:'12px', outline:'none' }}>
                <option value="score">Sort by Score</option>
                <option value="hours">Sort by Hours</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
            <Bar data={scoreChart} options={{...chartOpts(),plugins:{...chartOpts().plugins,legend:{display:false}}}} height={120}/>
          </div>
          <div className="card">
            <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>7-Day Score Trend</p>
            <Line data={trendData} options={{...chartOpts(),plugins:{legend:{display:false}},scales:{...chartOpts().scales,y:{...chartOpts().scales.y,min:0,max:100}}}} height={120}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
          <div className="card">
            <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>Active vs Idle Hours</p>
            <Bar data={hoursChart} options={chartOpts()} height={120}/>
          </div>
          <div className="card">
            <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px' }}>Weekly Heatmap</p>
            <div style={{ display:'flex', gap:'4px', marginBottom:'6px', marginLeft:'56px' }}>
              {['Mon','Tue','Wed','Thu','Fri'].map(d=><div key={d} style={{ width:'36px', textAlign:'center', fontSize:'11px', color:'#7b7a99' }}>{d}</div>)}
            </div>
            {heatGrid.map((row,hi)=>(
              <div key={hi} style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'4px' }}>
                <span style={{ width:'52px', fontSize:'10px', color:'#7b7a99', textAlign:'right', paddingRight:'8px' }}>{['9–11','11–1','1–3','3–5','5–7','Eve'][hi]}</span>
                {row.map((v,di)=><div key={di} style={{ width:'36px', height:'22px', borderRadius:'4px', background:`rgba(108,99,255,${v.toFixed(2)})`, cursor:'default' }} title={`${Math.round(v*100)}%`}/>)}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'20px' }}>Full Team Report</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>{['Name','Department','Score','Active Hrs','Idle Hrs','Burnout','Anomaly'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:'11px', color:'#7b7a99', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map(({user,productivity:p},i)=>(
                <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'12px', fontWeight:600, color:'#f0eeff' }}>{user.name}</td>
                  <td style={{ padding:'12px', color:'#7b7a99', fontSize:'13px' }}>{user.department||'—'}</td>
                  <td style={{ padding:'12px', fontFamily:'Syne,sans-serif', fontWeight:800, color:(p?.score||0)>=75?'#00d9a3':(p?.score||0)>=50?'#6c63ff':'#ff5c87' }}>{p?.score??'—'}</td>
                  <td style={{ padding:'12px', color:'#00d9a3', fontSize:'13px' }}>{p?(p.totalActiveSeconds/3600).toFixed(1)+'h':'—'}</td>
                  <td style={{ padding:'12px', color:'#7b7a99', fontSize:'13px' }}>{p?(p.totalIdleSeconds/3600).toFixed(1)+'h':'—'}</td>
                  <td style={{ padding:'12px' }}><span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'999px', fontWeight:600, background:p?.burnoutRisk==='high'?'rgba(255,92,135,0.15)':p?.burnoutRisk==='medium'?'rgba(255,179,71,0.15)':'rgba(0,217,163,0.15)', color:p?.burnoutRisk==='high'?'#ff5c87':p?.burnoutRisk==='medium'?'#ffb347':'#00d9a3' }}>{p?.burnoutRisk||'low'}</span></td>
                  <td style={{ padding:'12px', fontSize:'13px' }}>{p?.anomalyFlag?'⚠ Yes':'✅ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
