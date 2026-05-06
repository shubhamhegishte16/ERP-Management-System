import { useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';

const Toggle = ({ label, description, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1, paddingRight: '24px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: value ? 'var(--accent1)' : 'var(--surface2)', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
    </button>
  </div>
);

export default function Privacy() {
  const [settings, setSettings] = useState({
    trackingEnabled:    true,
    showNotifications:  true,
    trackBrowser:       true,
    trackCommunication: true,
    shareWithManager:   true,
    anonymizeReports:   false,
    gdprExport:         false,
  });

  const set = (key) => (val) => setSettings(s => ({ ...s, [key]: val }));
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role="employee" />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: 800 }}>Privacy Settings</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>You are in full control of what gets tracked</p>
        </div>

        {/* Privacy banner */}
        <div style={{ padding: '20px 24px', background: 'rgba(0,217,163,0.08)', border: '1px solid rgba(0,217,163,0.25)', borderRadius: '12px', marginBottom: '28px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <div>
            <p style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--accent3)' }}>Privacy-First by Design</p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
              WorkPulse never captures passwords, banking details, or any sensitive data. You can pause tracking at any time from the desktop app tray icon. All data collection is transparent and GDPR compliant.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Tracking controls */}
          <div className="card">
            <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tracking Controls</p>
            <Toggle label="Enable Tracking"        description="Master switch — pause all activity tracking." value={settings.trackingEnabled}    onChange={set('trackingEnabled')} />
            <Toggle label="Track Browser Activity" description="Log time spent in Chrome, Firefox, etc."       value={settings.trackBrowser}       onChange={set('trackBrowser')} />
            <Toggle label="Track Communication"    description="Log time in Slack, Teams, Zoom, etc."         value={settings.trackCommunication} onChange={set('trackCommunication')} />
            <Toggle label="Show Tracking Alerts"   description="Show popup when a new app starts tracking."   value={settings.showNotifications}  onChange={set('showNotifications')} />
          </div>

          {/* Sharing controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Sharing & Reports</p>
              <Toggle label="Share with Manager"  description="Allow your manager to see your productivity data." value={settings.shareWithManager} onChange={set('shareWithManager')} />
              <Toggle label="Anonymize in Reports" description="Your data appears without your name in team-level reports." value={settings.anonymizeReports} onChange={set('anonymizeReports')} />
            </div>

            {/* GDPR */}
            <div className="card">
              <p style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Your Data Rights (GDPR)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn-ghost" style={{ width: '100%', padding: '12px', textAlign: 'left', fontSize: '13px' }}>
                  📥 Export My Data
                </button>
                <button className="btn-ghost" style={{ width: '100%', padding: '12px', textAlign: 'left', fontSize: '13px' }}>
                  🗑️ Request Data Deletion
                </button>
                <button className="btn-ghost" style={{ width: '100%', padding: '12px', textAlign: 'left', fontSize: '13px' }}>
                  📋 View Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button className="btn-primary" onClick={save} style={{ padding: '12px 32px' }}>
            {saved ? '✅ Saved!' : 'Save Preferences'}
          </button>
        </div>
      </main>
    </div>
  );
}
