import { useEffect, useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import api from '../../utils/api';

const AlertCard = ({ type, title, name, detail, time }) => {
  const styles = {
    burnout: { bg: 'rgba(255,92,135,0.08)', border: 'var(--accent2)', icon: '🔥' },
    anomaly: { bg: 'rgba(255,179,71,0.08)', border: 'var(--accent4)', icon: '⚠️' },
    info:    { bg: 'rgba(0,217,163,0.08)',  border: 'var(--accent3)', icon: '✅' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ padding: '18px 20px', background: s.bg, borderLeft: `3px solid ${s.border}`, borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
      <span style={{ fontSize: '22px', marginTop: '2px' }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{title}</p>
          {time && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(time).toLocaleDateString()}</span>}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: name ? '6px' : 0 }}>{detail}</p>
        {name && <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent1)' }}>👤 {name}</p>}
      </div>
    </div>
  );
};

export default function Alerts() {
  const [data, setData]     = useState({ burnoutAlerts: [], anomalies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/team')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalAlerts = data.burnoutAlerts.length + data.anomalies.length;

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="manager" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role="manager" />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: 800 }}>AI Alerts</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>Automated insights from WorkPulse AI</p>
          </div>
          {totalAlerts > 0 && (
            <span style={{ background: 'var(--accent2)', color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', padding: '4px 12px', borderRadius: '999px' }}>
              {totalAlerts} Active
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Burnout Alerts', value: data.burnoutAlerts.length, color: 'var(--accent2)' },
            { label: 'Anomalies', value: data.anomalies.length, color: 'var(--accent4)' },
            { label: 'All Clear', value: totalAlerts === 0 ? '✅' : '—', color: 'var(--accent3)' },
          ].map((s, i) => (
            <div key={i} className="card">
              <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{s.label}</p>
              <p style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {totalAlerts === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</p>
            <p style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>All Clear!</p>
            <p style={{ color: 'var(--muted)' }}>No burnout risks or anomalies detected today. Your team is doing great!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Burnout */}
            <div className="card">
              <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>🔥 Burnout Risks</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.burnoutAlerts.length === 0
                  ? <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No burnout risks detected ✅</p>
                  : data.burnoutAlerts.map((a, i) => (
                      <AlertCard key={i} type="burnout" title={`Burnout Risk: ${a.burnoutRisk?.toUpperCase()}`} name={a.user?.name} detail={`Working excessively — risk level is ${a.burnoutRisk}. Consider redistributing tasks or encouraging time off.`} time={a.date} />
                    ))
                }
              </div>
            </div>

            {/* Anomalies */}
            <div className="card">
              <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>⚠️ Anomalies</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.anomalies.length === 0
                  ? <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No anomalies detected ✅</p>
                  : data.anomalies.map((a, i) => (
                      <AlertCard key={i} type="anomaly" title="Unusual Activity Pattern" name={a.user?.name} detail={a.anomalyReason || 'Activity significantly below average'} time={a.date} />
                    ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card" style={{ marginTop: '16px' }}>
          <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>💡 AI Recommendations</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AlertCard type="info" title="Schedule 1:1s with high-risk employees" detail="Regular check-ins reduce burnout by up to 40%. Consider this week." />
            <AlertCard type="info" title="Review workload distribution" detail="Consider moving tasks from overloaded team members to those with capacity." />
          </div>
        </div>
      </main>
    </div>
  );
}
