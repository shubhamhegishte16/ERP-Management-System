import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function MemberModal({ member, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const p = member.productivity;

  useEffect(() => {
    api.get(`/activity/hourly/${member.user._id}`)
      .then(r => setActivities(r.data.breakdown || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [member.user._id]);

  const score = p?.score ?? 0;
  const scoreColor = score >= 75 ? '#00d9a3' : score >= 50 ? '#6c63ff' : '#ff5c87';
  const burnoutColor = { high:'#ff5c87', medium:'#ffb347', low:'#00d9a3' };
  const avatarColors = ['#6c63ff','#ff5c87','#00d9a3','#ffb347','#a89dff'];
  const avatarColor = avatarColors[member.user.name?.charCodeAt(0) % avatarColors.length];

  const topApps = p?.topApps || [
    { appName:'VS Code', durationSeconds:3600 },
    { appName:'Chrome', durationSeconds:1800 },
    { appName:'Slack',  durationSeconds:900  },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={onClose}>
      <div style={{ background:'#12121a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'620px', maxHeight:'85vh', overflowY:'auto', padding:'32px' }} onClick={e=>e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:`linear-gradient(135deg,${avatarColor},#ff5c87)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:800, color:'white' }}>
              {member.user.name[0]}
            </div>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:'#f0eeff', marginBottom:'4px' }}>{member.user.name}</h2>
              <p style={{ fontSize:'13px', color:'#7b7a99' }}>{member.user.email}</p>
              <div style={{ display:'flex', gap:'8px', marginTop:'6px' }}>
                <span style={{ fontSize:'11px', padding:'2px 10px', borderRadius:'999px', background:'rgba(108,99,255,0.15)', color:'#6c63ff', fontWeight:600 }}>{member.user.role}</span>
                <span style={{ fontSize:'11px', padding:'2px 10px', borderRadius:'999px', background:'rgba(0,217,163,0.15)', color:'#00d9a3', fontWeight:600 }}>{member.user.department||'No dept'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#f0eeff', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
          <div style={{ background:'#1a1a28', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <p style={{ fontSize:'11px', color:'#7b7a99', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>Score</p>
            <p style={{ fontSize:'28px', fontWeight:800, color:scoreColor }}>{score}</p>
          </div>
          <div style={{ background:'#1a1a28', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <p style={{ fontSize:'11px', color:'#7b7a99', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>Active Hours</p>
            <p style={{ fontSize:'28px', fontWeight:800, color:'#6c63ff' }}>{p ? (p.totalActiveSeconds/3600).toFixed(1) : '0'}h</p>
          </div>
          <div style={{ background:'#1a1a28', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
            <p style={{ fontSize:'11px', color:'#7b7a99', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>Burnout</p>
            <p style={{ fontSize:'20px', fontWeight:800, color:burnoutColor[p?.burnoutRisk||'low'] }}>{p?.burnoutRisk||'low'}</p>
          </div>
        </div>

        {/* Productivity bar */}
        <div style={{ background:'#1a1a28', borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#f0eeff' }}>Productivity Score</p>
            <p style={{ fontSize:'13px', fontWeight:800, color:scoreColor }}>{score}/100</p>
          </div>
          <div style={{ height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ width:`${score}%`, height:'100%', background:`linear-gradient(90deg, #6c63ff, ${scoreColor})`, borderRadius:'4px', transition:'width 0.8s ease' }}/>
          </div>
          <p style={{ fontSize:'12px', color:'#7b7a99', marginTop:'8px' }}>
            {score >= 75 ? '🌟 Excellent performer!' : score >= 50 ? '👍 Good performance, room to improve' : '⚠️ Needs attention and support'}
          </p>
        </div>

        {/* Top Apps */}
        <div style={{ background:'#1a1a28', borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
          <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px' }}>Top Apps Today</p>
          {topApps.slice(0,4).map((app,i) => {
            const maxSecs = topApps[0]?.durationSeconds || 1;
            const pct = Math.round((app.durationSeconds/maxSecs)*100);
            const colors = ['#6c63ff','#ff5c87','#00d9a3','#ffb347'];
            return (
              <div key={i} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'13px', color:'#f0eeff' }}>{app.appName}</span>
                  <span style={{ fontSize:'12px', color:'#7b7a99' }}>{Math.round(app.durationSeconds/60)}m</span>
                </div>
                <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:colors[i], borderRadius:'2px' }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insight */}
        <div style={{ padding:'16px 20px', background: p?.anomalyFlag ? 'rgba(255,179,71,0.08)' : p?.burnoutRisk==='high' ? 'rgba(255,92,135,0.08)' : 'rgba(0,217,163,0.08)', borderLeft:`3px solid ${p?.anomalyFlag ? '#ffb347' : p?.burnoutRisk==='high' ? '#ff5c87' : '#00d9a3'}`, borderRadius:'10px' }}>
          <p style={{ fontSize:'13px', fontWeight:700, marginBottom:'4px', color:'#f0eeff' }}>🤖 AI Insight</p>
          <p style={{ fontSize:'13px', color:'#7b7a99', lineHeight:1.6 }}>
            {p?.anomalyFlag ? `⚠️ ${p.anomalyReason || 'Unusual activity pattern detected today.'}` :
             p?.burnoutRisk==='high' ? '🔥 High burnout risk detected. Consider redistributing tasks or scheduling a 1:1.' :
             p?.burnoutRisk==='medium' ? '⚡ Medium burnout risk. Monitor workload over next few days.' :
             '✅ Employee is performing well with no anomalies detected today.'}
          </p>
        </div>
      </div>
    </div>
  );
}
