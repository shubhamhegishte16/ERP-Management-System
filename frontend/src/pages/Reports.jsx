import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Reports() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = async (type) => {
    setGenerating(true);
    try {
      // Fetch data
      const [summary, projects] = await Promise.all([
        api.get('/analytics/summary').catch(() => ({ data: { summary: [] } })),
        api.get('/projects').catch(() => ({ data: { projects: [] } })),
      ]);

      const members = summary.data.summary || [];
      const projs = projects.data.projects || [];

      // Build HTML report
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>WorkPulse ${type} Report</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 40px; background: white; }
  h1 { color: #6c63ff; font-size: 28px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #f8f7ff; border-radius: 10px; padding: 16px; text-align: center; border-left: 4px solid #6c63ff; }
  .kpi-val { font-size: 28px; font-weight: 800; color: #6c63ff; }
  .kpi-label { font-size: 12px; color: #666; margin-top: 4px; }
  h2 { color: #1a1a2e; font-size: 18px; margin: 24px 0 12px; border-bottom: 2px solid #6c63ff; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #6c63ff; color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
  td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
  tr:nth-child(even) td { background: #f8f7ff; }
  .badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge-high { background: #ffe0e6; color: #ff5c87; }
  .badge-medium { background: #fff3e0; color: #ff9800; }
  .badge-low { background: #e0f7ef; color: #00c48c; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
</style>
</head>
<body>
<h1>🚀 WorkPulse — ${type} Report</h1>
<p class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} · Confidential</p>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val">${members.length}</div><div class="kpi-label">Total Employees</div></div>
  <div class="kpi"><div class="kpi-val">${members.filter(m=>m.productivity?.score>0).length}</div><div class="kpi-label">Active Today</div></div>
  <div class="kpi"><div class="kpi-val">${members.length ? Math.round(members.reduce((s,m)=>s+(m.productivity?.score||0),0)/members.length) : 0}%</div><div class="kpi-label">Avg Productivity</div></div>
  <div class="kpi"><div class="kpi-val">${members.filter(m=>m.productivity?.burnoutRisk==='high').length}</div><div class="kpi-label">Burnout Risk</div></div>
</div>

<h2>👥 Team Performance</h2>
<table>
  <tr><th>Name</th><th>Department</th><th>Role</th><th>Score</th><th>Active Hours</th><th>Burnout Risk</th></tr>
  ${members.map(m => `
  <tr>
    <td><strong>${m.user.name}</strong></td>
    <td>${m.user.department || '—'}</td>
    <td>${m.user.role}</td>
    <td><strong style="color:#6c63ff">${m.productivity?.score ?? '—'}</strong></td>
    <td>${m.productivity ? (m.productivity.totalActiveSeconds/3600).toFixed(1)+'h' : '—'}</td>
    <td><span class="badge badge-${m.productivity?.burnoutRisk||'low'}">${m.productivity?.burnoutRisk||'low'}</span></td>
  </tr>`).join('')}
</table>

<h2>📋 Projects Overview</h2>
<table>
  <tr><th>Project</th><th>Status</th><th>Tasks</th><th>Completion</th><th>Manager</th></tr>
  ${projs.map(p => {
    const done = p.tasks?.filter(t=>t.status==='done').length||0;
    const total = p.tasks?.length||0;
    const pct = total ? Math.round((done/total)*100) : 0;
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.status}</td>
      <td>${done}/${total}</td>
      <td><strong style="color:#6c63ff">${pct}%</strong></td>
      <td>${p.manager?.name||'—'}</td>
    </tr>`;
  }).join('')}
</table>

<div class="footer">
  WorkPulse AI Employee Intelligence · Report generated automatically · ${new Date().toISOString()}
</div>
</body>
</html>`;

      // Open in new window and print
      const win = window.open('', '_blank');
      win.document.write(reportHTML);
      win.document.close();
      setTimeout(() => win.print(), 500);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    { type:'Team Performance', icon:'👥', desc:'Productivity scores, burnout risks, active hours for all team members', color:'#6c63ff' },
    { type:'Projects Summary', icon:'📋', desc:'All projects, task completion rates, milestones and manager assignments', color:'#ff5c87' },
    { type:'Attendance Report', icon:'📅', desc:'Monthly attendance records, clock in/out times, late arrivals', color:'#00d9a3' },
    { type:'AI Insights', icon:'🧠', desc:'Anomaly detections, burnout predictions and AI recommendations', color:'#ffb347' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>Export Reports</h2>
          <p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>Generate and download PDF reports</p>
        </div>

        {generated && (
          <div style={{ background:'rgba(0,217,163,0.1)', border:'1px solid rgba(0,217,163,0.3)', borderRadius:'10px', padding:'14px 20px', marginBottom:'24px', color:'#00d9a3', fontSize:'14px', fontWeight:600 }}>
            ✅ Report generated! Check your new browser tab to save as PDF (Ctrl+P → Save as PDF)
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', marginBottom:'32px' }}>
          {reportTypes.map((r,i) => (
            <div key={i} className="card" style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`rgba(${r.color==='#6c63ff'?'108,99,255':r.color==='#ff5c87'?'255,92,135':r.color==='#00d9a3'?'0,217,163':'255,179,71'},0.15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'15px', fontWeight:700, color:'#f0eeff', marginBottom:'6px' }}>{r.type}</p>
                <p style={{ fontSize:'13px', color:'#7b7a99', lineHeight:1.6, marginBottom:'14px' }}>{r.desc}</p>
                <button className="btn-primary" onClick={()=>generateReport(r.type)} disabled={generating} style={{ padding:'8px 20px', fontSize:'13px' }}>
                  {generating ? '⏳ Generating...' : '📥 Download PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="card" style={{ background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.2)' }}>
          <p style={{ fontSize:'14px', fontWeight:700, color:'#6c63ff', marginBottom:'10px' }}>💡 How to save as PDF</p>
          <p style={{ fontSize:'13px', color:'#7b7a99', lineHeight:1.8 }}>
            1. Click <strong style={{color:'#f0eeff'}}>Download PDF</strong> — a new tab opens with the report<br/>
            2. Press <strong style={{color:'#f0eeff'}}>Ctrl + P</strong> (Windows) or <strong style={{color:'#f0eeff'}}>Cmd + P</strong> (Mac)<br/>
            3. In the print dialog, change destination to <strong style={{color:'#f0eeff'}}>"Save as PDF"</strong><br/>
            4. Click <strong style={{color:'#f0eeff'}}>Save</strong> — done! ✅
          </p>
        </div>
      </main>
    </div>
  );
}
