import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { todo:'#7b7a99', inprogress:'#6c63ff', done:'#00d9a3' };
const statusLabel = { todo:'📋 To Do', inprogress:'🔄 In Progress', done:'✅ Done' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title:'', estimatedHours:'' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => {
      const found = r.data.projects.find(p => p._id === id);
      setProject(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const updateTaskStatus = async (taskIndex, newStatus) => {
    const updated = { ...project };
    updated.tasks[taskIndex].status = newStatus;
    setProject({ ...updated });
    try {
      await api.put(`/projects/${id}`, { tasks: updated.tasks });
    } catch (err) { console.error(err); }
  };

  const addTask = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const updatedTasks = [...(project.tasks||[]), { title: newTask.title, estimatedHours: parseFloat(newTask.estimatedHours)||0, status:'todo', loggedHours:0 }];
      const { data } = await api.put(`/projects/${id}`, { tasks: updatedTasks });
      setProject(data.project);
      setNewTask({ title:'', estimatedHours:'' });
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:'flex' }}><Sidebar role={user?.role}/><div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><div className="spinner" style={{ width:'36px', height:'36px' }}/></div></div>;
  if (!project) return <div style={{ display:'flex' }}><Sidebar role={user?.role}/><div style={{ flex:1, padding:'32px' }}><p style={{ color:'#7b7a99' }}>Project not found.</p></div></div>;

  const done  = project.tasks?.filter(t=>t.status==='done').length||0;
  const total = project.tasks?.length||0;
  const pct   = total ? Math.round((done/total)*100) : 0;
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const inp = { background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'8px', padding:'8px 12px', outline:'none', fontSize:'13px' };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role}/>
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        {/* Back button */}
        <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#7b7a99', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', marginBottom:'24px' }}>← Back</button>

        {/* Project header */}
        <div className="card" style={{ marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
            <div>
              <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff', marginBottom:'6px' }}>{project.name}</h2>
              {project.description && <p style={{ fontSize:'14px', color:'#7b7a99' }}>{project.description}</p>}
            </div>
            <span style={{ fontSize:'12px', padding:'4px 14px', borderRadius:'999px', fontWeight:600, background:'rgba(0,217,163,0.15)', color:'#00d9a3' }}>{project.status}</span>
          </div>

          {/* Progress */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'13px', color:'#7b7a99' }}>Overall Progress</span>
              <span style={{ fontSize:'13px', fontWeight:800, color:'#6c63ff' }}>{pct}%</span>
            </div>
            <div style={{ height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg,#6c63ff,#00d9a3)', borderRadius:'4px', transition:'width 0.5s' }}/>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:'24px' }}>
            <span style={{ fontSize:'13px', color:'#7b7a99' }}>👤 Manager: <strong style={{color:'#f0eeff'}}>{project.manager?.name||'N/A'}</strong></span>
            <span style={{ fontSize:'13px', color:'#7b7a99' }}>✅ {done}/{total} tasks done</span>
            <span style={{ fontSize:'13px', color:'#7b7a99' }}>👥 {project.team?.length||0} members</span>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <h3 style={{ fontSize:'18px', fontWeight:700, color:'#f0eeff' }}>Tasks</h3>
          {isManager && <button className="btn-primary" onClick={()=>setShowForm(!showForm)} style={{ padding:'8px 20px', fontSize:'13px' }}>+ Add Task</button>}
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom:'16px' }}>
            <form onSubmit={addTask} style={{ display:'flex', gap:'12px', alignItems:'flex-end' }}>
              <div style={{ flex:1 }}><label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Task Title</label><input value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="Enter task title..." style={{...inp,width:'100%'}} required/></div>
              <div style={{ width:'120px' }}><label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Est. Hours</label><input type="number" value={newTask.estimatedHours} onChange={e=>setNewTask({...newTask,estimatedHours:e.target.value})} placeholder="0" style={{...inp,width:'100%'}}/></div>
              <button className="btn-primary" type="submit" disabled={saving} style={{ padding:'8px 20px' }}>{saving?'Adding...':'Add'}</button>
              <button type="button" onClick={()=>setShowForm(false)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#7b7a99', padding:'8px 16px', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
            </form>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {project.tasks?.length === 0 && <div className="card" style={{ textAlign:'center', padding:'40px', color:'#7b7a99' }}>No tasks yet. {isManager?'Add one above!':''}</div>}
          {project.tasks?.map((task, i) => (
            <div key={i} className="card" style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px' }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'14px', fontWeight:600, color: task.status==='done'?'#7b7a99':'#f0eeff', textDecoration: task.status==='done'?'line-through':'none', marginBottom:'4px' }}>{task.title}</p>
                <div style={{ display:'flex', gap:'16px' }}>
                  {task.estimatedHours > 0 && <span style={{ fontSize:'11px', color:'#7b7a99' }}>⏱ Est: {task.estimatedHours}h</span>}
                  {task.assignedTo && <span style={{ fontSize:'11px', color:'#7b7a99' }}>👤 Assigned</span>}
                </div>
              </div>
              {isManager ? (
                <select value={task.status} onChange={e=>updateTaskStatus(i,e.target.value)}
                  style={{ background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color: statusColor[task.status], borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:600, cursor:'pointer', outline:'none' }}>
                  <option value="todo">📋 To Do</option>
                  <option value="inprogress">🔄 In Progress</option>
                  <option value="done">✅ Done</option>
                </select>
              ) : (
                <span style={{ fontSize:'12px', padding:'4px 12px', borderRadius:'999px', fontWeight:600, background:`rgba(${task.status==='done'?'0,217,163':task.status==='inprogress'?'108,99,255':'123,122,153'},0.15)`, color:statusColor[task.status] }}>
                  {statusLabel[task.status]}
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
