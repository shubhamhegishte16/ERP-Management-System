import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import Sidebar from '../../components/dashboard/Sidebar';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const categoryIcon = { coding: '💻', browsing: '🌐', communication: '💬', design: '🎨', docs: '📄', meeting: '🎥', idle: '💤', other: '📱' };
const categoryColor = { coding: '#6c63ff', browsing: '#ff5c87', communication: '#00d9a3', design: '#a89dff', docs: '#ffb347', meeting: '#31c4ff', idle: '#6b7280', other: '#7b7a99' };

function formatDuration(seconds) {
  const totalMinutes = Math.round((seconds || 0) / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity/me')
      .then((response) => {
        setActivities(response.data.activities || []);
        setSummary(response.data.summary || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categoryEntries = Object.entries(summary?.categoryTotals || {});
  const barData = {
    labels: categoryEntries.map(([category]) => category.charAt(0).toUpperCase() + category.slice(1)),
    datasets: [{
      label: 'Minutes',
      data: categoryEntries.map(([, seconds]) => Math.round(seconds / 60)),
      backgroundColor: categoryEntries.map(([category]) => categoryColor[category] || '#7b7a99'),
      borderRadius: 8,
    }],
  };

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="employee" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role="employee" />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: 800 }}>My Activity</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>
            {summary?.eventCount || 0} sessions logged today · {formatDuration(summary?.totalActiveSeconds || 0)} active · {summary?.trackedAppCount || 0} apps tracked
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>⏱</p>
            <p style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No activity yet</p>
            <p style={{ color: 'var(--muted)' }}>Start the desktop tracker and sign in there to begin collecting application usage logs.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: 'Tracked Time', value: formatDuration(summary?.totalTrackedSeconds || 0), color: 'var(--accent1)' },
                { label: 'Active Time', value: formatDuration(summary?.totalActiveSeconds || 0), color: 'var(--accent3)' },
                { label: 'Idle Time', value: formatDuration(summary?.totalIdleSeconds || 0), color: 'var(--accent2)' },
                { label: 'Last Sync', value: summary?.lastCaptureAt ? new Date(summary.lastCaptureAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending', color: 'var(--accent4)' },
              ].map((item) => (
                <div key={item.label} className="card">
                  <p style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{item.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="card">
                <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Time by Category</p>
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: '#7b7a99' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                      y: { ticks: { color: '#7b7a99' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    },
                  }}
                  height={80}
                />
              </div>

              <div className="card">
                <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Top Applications</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(summary?.topApps || []).map((app) => (
                    <div key={app.appName} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{app.appName}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{formatDuration(app.durationSeconds)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Detailed Session Log</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.map((activity) => (
                  <div key={activity._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: '10px', borderLeft: `3px solid ${categoryColor[activity.category] || '#555'}` }}>
                    <span style={{ fontSize: '18px' }}>{categoryIcon[activity.category] || '📱'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{activity.isPrivate ? '[Private Session]' : activity.appName}</p>
                      {!activity.isPrivate && activity.windowTitle && (
                        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {activity.windowTitle.slice(0, 70)}{activity.windowTitle.length > 70 ? '...' : ''}
                        </p>
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                        {new Date(activity.sessionStart || activity.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(activity.sessionEnd || activity.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: categoryColor[activity.category] }}>{formatDuration(activity.durationSeconds)}</p>
                      <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{activity.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
