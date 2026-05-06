import { useState, useRef, useEffect } from 'react';
import { useNotifs } from '../../context/NotifContext';

const typeColor = { danger:'#ff5c87', warning:'#ffb347', success:'#00d9a3', info:'#6c63ff' };
const typeIcon  = { danger:'🔥', warning:'⚠️', success:'✅', info:'ℹ️' };

export default function NotifBell() {
  const { notifs, unread, markRead, markAllRead } = useNotifs();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(!open)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'8px 12px', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', gap:'6px', color:'#f0eeff' }}>
        <span style={{ fontSize:'18px' }}>🔔</span>
        {unread > 0 && (
          <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#ff5c87', color:'white', fontSize:'10px', fontWeight:700, width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>{unread}</span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:'360px', background:'#12121a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', zIndex:999, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontWeight:700, fontSize:'15px', color:'#f0eeff' }}>Notifications {unread > 0 && <span style={{ fontSize:'11px', background:'#ff5c87', color:'white', padding:'2px 8px', borderRadius:'999px', marginLeft:'8px' }}>{unread} new</span>}</p>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize:'12px', color:'#6c63ff', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight:'360px', overflowY:'auto' }}>
            {notifs.length === 0
              ? <p style={{ padding:'32px', textAlign:'center', color:'#7b7a99' }}>No notifications</p>
              : notifs.map(n => (
                <div key={n.id} onClick={()=>markRead(n.id)} style={{ display:'flex', gap:'12px', padding:'14px 20px', cursor:'pointer', background: n.read ? 'transparent' : 'rgba(108,99,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background=n.read?'transparent':'rgba(108,99,255,0.05)'}>
                  <span style={{ fontSize:'20px', marginTop:'2px' }}>{typeIcon[n.type]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'3px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#f0eeff' }}>{n.title}</p>
                      {!n.read && <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#6c63ff', flexShrink:0, marginTop:'4px' }}/>}
                    </div>
                    <p style={{ fontSize:'12px', color:'#7b7a99', lineHeight:1.5 }}>{n.message}</p>
                    <p style={{ fontSize:'11px', color: typeColor[n.type], marginTop:'4px' }}>{n.time}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
