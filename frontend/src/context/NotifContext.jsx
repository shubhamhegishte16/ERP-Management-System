import { createContext, useContext, useState } from 'react';

const NotifContext = createContext();

const DEMO_NOTIFS = [
  { id:1, type:'danger',  title:'Burnout Alert',       message:'Sarah Khan has worked 12h+ for 5 days', time:'2 min ago',  read:false },
  { id:2, type:'warning', title:'Anomaly Detected',    message:'Rahul Mehta coding time 70% below average', time:'15 min ago', read:false },
  { id:3, type:'success', title:'Project Milestone',   message:'WorkPulse MVP reached 75% completion', time:'1 hr ago',  read:false },
  { id:4, type:'info',    title:'New Team Member',     message:'Priya Nair joined the Engineering team', time:'3 hrs ago', read:true },
  { id:5, type:'success', title:'Productivity Up',     message:'Team productivity increased by 12% this week', time:'5 hrs ago', read:true },
];

export const NotifProvider = ({ children }) => {
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  const unread = notifs.filter(n => !n.read).length;
  const markRead = (id) => setNotifs(notifs.map(n => n.id===id ? {...n,read:true} : n));
  const markAllRead = () => setNotifs(notifs.map(n => ({...n,read:true})));
  const addNotif = (notif) => setNotifs([{...notif, id:Date.now(), time:'Just now', read:false}, ...notifs]);
  return <NotifContext.Provider value={{ notifs, unread, markRead, markAllRead, addNotif }}>{children}</NotifContext.Provider>;
};

export const useNotifs = () => useContext(NotifContext);
