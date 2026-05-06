export default function KPICard({ label, value, change, changeType = 'up', color = 'var(--accent1)' }) {
  return (
    <div className="card" style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background: color }} />
      <p style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>{label}</p>
      <p style={{ fontFamily:'Syne', fontSize:'30px', fontWeight:800, color }}>{value}</p>
      {change && (
        <p style={{ fontSize:'12px', marginTop:'6px', color: changeType === 'up' ? 'var(--accent3)' : changeType === 'down' ? 'var(--accent2)' : 'var(--muted)' }}>
          {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '•'} {change}
        </p>
      )}
    </div>
  );
}
