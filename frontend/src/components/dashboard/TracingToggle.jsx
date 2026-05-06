import { useEffect, useState } from 'react';

export default function TracingToggle({ storageKey = 'wp_tracing_active' }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const toggleTracing = () => {
    const next = !active;
    setActive(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <button
      onClick={toggleTracing}
      style={{
        display:'flex',
        alignItems:'center',
        gap:'10px',
        padding:'10px 20px',
        borderRadius:'10px',
        border:'1px solid',
        borderColor: active ? 'var(--accent3)' : 'var(--accent2)',
        background: active ? 'rgba(0,217,163,0.1)' : 'rgba(255,92,135,0.1)',
        color: active ? 'var(--accent3)' : 'var(--accent2)',
        cursor:'pointer',
        fontWeight:600,
        fontSize:'14px',
      }}
    >
      <span>{active ? 'Tracing Active' : 'Start Active Tracing'}</span>
    </button>
  );
}
