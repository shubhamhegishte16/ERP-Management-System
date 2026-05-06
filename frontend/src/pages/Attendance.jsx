import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Attendance() {
  const { user } = useAuth();
  const [records] = useState(() => {
    const saved = localStorage.getItem('wp_attendance');
    return saved ? JSON.parse(saved) : generateDemoData();
  });
  const [selectedMonth] = useState(new Date());

  function generateDemoData() {
    const data = [];
    const today = new Date();
    for (let i = 1; i <= 19; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const inH = 8 + Math.floor(Math.random() * 2);
        const inM = Math.floor(Math.random() * 30);
        const outH = inH + 8 + Math.floor(Math.random() * 2);
        const outM = Math.floor(Math.random() * 60);
        data.push({
          date: d.toISOString().split('T')[0],
          clockIn: `${String(inH).padStart(2,'0')}:${String(inM).padStart(2,'0')}`,
          clockOut: outH < 24 ? `${String(outH).padStart(2,'0')}:${String(outM).padStart(2,'0')}` : '18:00',
          hours: (outH - inH + (outM - inM) / 60).toFixed(1),
          status: inH <= 9 ? 'ontime' : 'late',
        });
      }
    }
    return data;
  }

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
  const recordMap = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const totalDays = records.length;
  const onTime = records.filter(r => r.status === 'ontime').length;
  const late = records.filter(r => r.status === 'late').length;
  const avgHours = totalDays ? (records.reduce((s, r) => s + parseFloat(r.hours), 0) / totalDays).toFixed(1) : 0;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>Attendance</h2>
          <p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>Attendance records overview</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
          {[
            { label:'Days Present', value:totalDays, color:'#6c63ff' },
            { label:'On Time', value:onTime, color:'#00d9a3' },
            { label:'Late', value:late, color:'#ff5c87' },
            { label:'Avg Hours', value:`${avgHours}h`, color:'#ffb347' },
          ].map((s, i) => (
            <div key={i} className="card">
              <p style={{ fontSize:'11px', color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{s.label}</p>
              <p style={{ fontSize:'32px', fontWeight:800, color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
          <div className="card">
            <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px' }}>
              {selectedMonth.toLocaleDateString('en-IN', { month:'long', year:'numeric' })}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'8px' }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ textAlign:'center', fontSize:'11px', color:'#7b7a99', fontWeight:600, padding:'4px' }}>{d}</div>
              ))}
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1;
                const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const rec = recordMap[dateStr];
                const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <div key={day} title={rec ? `In: ${rec.clockIn} Out: ${rec.clockOut} (${rec.hours}h)` : ''} style={{ aspectRatio:'1', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:600, cursor: rec ? 'pointer' : 'default', background: isToday ? '#6c63ff' : rec?.status === 'ontime' ? 'rgba(0,217,163,0.2)' : rec?.status === 'late' ? 'rgba(255,179,71,0.2)' : isWeekend ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', color: isToday ? 'white' : rec ? '#f0eeff' : '#7b7a99' }}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <p style={{ fontSize:'13px', fontWeight:700, color:'#7b7a99', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px' }}>Recent Records</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'360px', overflowY:'auto' }}>
              {records.slice(0,10).map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'#1a1a28', borderRadius:'8px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: r.status === 'ontime' ? '#00d9a3' : '#ffb347', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'13px', fontWeight:600, color:'#f0eeff' }}>{new Date(r.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</p>
                    <p style={{ fontSize:'11px', color:'#7b7a99' }}>{r.clockIn} -> {r.clockOut}</p>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:700, color: parseFloat(r.hours) >= 8 ? '#00d9a3' : '#ffb347' }}>{r.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
