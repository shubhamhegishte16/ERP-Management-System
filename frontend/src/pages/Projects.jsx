import { useEffect, useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', endDate:'', manager:'', employeeOne:'', employeeTwo:'' });
  const [saving, setSaving] = useState(false);

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, peopleRes] = await Promise.all([
          api.get('/projects'),
          isManager ? api.get('/analytics/summary') : Promise.resolve({ data: { summary: [] } }),
        ]);

        setProjects(projectsRes.data.projects);

        if (isManager) {
          const users = peopleRes.data.summary.map(item => item.user);
          const employeeList = user?.role === 'admin'
            ? users.filter(person => person.role === 'employee' || person.role === 'manager')
            : users.filter(person => person.role === 'employee');
          const managerList = users.filter(person => person.role === 'manager');
          setEmployees(employeeList);
          setManagers(managerList);
          setForm(current => ({
            ...current,
            manager: current.manager || (user?.role === 'admin' ? managerList[0]?._id || '' : ''),
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isManager, user?.role]);

  const createProject = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const team = [form.employeeOne, form.employeeTwo].filter(Boolean);
      const payload = {
        name: form.name,
        description: form.description,
        endDate: form.endDate,
        team,
      };

      if (user?.role === 'admin' && form.manager) payload.manager = form.manager;

      const { data } = await api.post('/projects', payload);
      setProjects([...projects, data.project]);
      setShowForm(false);
      setForm({ name:'', description:'', endDate:'', manager: user?.role === 'admin' ? managers[0]?._id || '' : '', employeeOne:'', employeeTwo:'' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project? This also removes its tasks.')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const completeProject = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}/complete-my-work`);
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete project');
    }
  };

  const statusColor = { active:'var(--accent3)', completed:'var(--accent1)', onhold:'var(--accent4)' };

  if (loading) {
    return (
      <div style={{ display:'flex' }}>
        <Sidebar role={user?.role} />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="spinner" style={{ width:'36px', height:'36px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
          <div>
            <h2 style={{ fontFamily:'Syne', fontSize:'26px', fontWeight:800 }}>Projects</h2>
            <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'4px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          {isManager && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Project</button>}
        </div>

        {showForm && (
          <div className="card fade-up" style={{ marginBottom:'24px' }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:'20px' }}>Create Project</h3>
            <form onSubmit={createProject} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div><label>Project Name</label><input value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} placeholder="WorkPulse MVP" required /></div>
              <div><label>Description</label><input value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Brief description..." /></div>
              <div><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate:e.target.value })} /></div>
              {user?.role === 'admin' && (
                <div>
                  <label>Manager</label>
                  <select value={form.manager} onChange={e => setForm({ ...form, manager:e.target.value })}>
                    <option value="">Select manager</option>
                    {managers.map(manager => <option key={manager._id} value={manager._id}>{manager.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label>Employee Assign 1</label>
                  <select value={form.employeeOne} onChange={e => setForm({ ...form, employeeOne:e.target.value })}>
                    <option value="">Select employee</option>
                    {employees.map(employee => <option key={employee._id} value={employee._id}>{employee.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Employee Assign 2</label>
                  <select value={form.employeeTwo} onChange={e => setForm({ ...form, employeeTwo:e.target.value })}>
                    <option value="">Select employee</option>
                    {employees.map(employee => <option key={employee._id} value={employee._id}>{employee.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? <span className="spinner" /> : 'Create'}</button>
                <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0
          ? <div className="card" style={{ textAlign:'center', padding:'60px' }}><p style={{ color:'var(--muted)' }}>No projects yet.{isManager ? ' Create one above!' : ''}</p></div>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'16px' }}>
              {projects.map(project => {
                const done = project.tasks?.filter(task => task.status === 'done').length || 0;
                const total = project.tasks?.length || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const isAssignedEmployee = user?.role === 'employee' && project.team?.some(member => String(member._id) === String(user._id));
                return (
                  <div key={project._id} className="card" style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontFamily:'Syne', fontSize:'17px', fontWeight:700 }}>{project.name}</h3>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'999px', fontWeight:600, background:'rgba(0,0,0,0.3)', color: statusColor[project.status] || 'var(--muted)' }}>{project.status}</span>
                        {user?.role === 'admin' && (
                          <button type="button" onClick={() => deleteProject(project._id)} title="Delete project" style={{ background:'rgba(255,92,135,0.12)', border:'1px solid rgba(255,92,135,0.28)', color:'var(--accent2)', borderRadius:'6px', width:'26px', height:'26px', cursor:'pointer', fontWeight:700 }}>x</button>
                        )}
                      </div>
                    </div>
                    {project.description && <p style={{ fontSize:'13px', color:'var(--muted)', marginBottom:'16px', lineHeight:1.6 }}>{project.description}</p>}

                    <div style={{ marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'12px', color:'var(--muted)' }}>Progress</span>
                        <span style={{ fontSize:'12px', fontWeight:700, color:'var(--accent1)' }}>{pct}%</span>
                      </div>
                      <div style={{ height:'6px', background:'var(--surface2)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, #6c63ff, #00d9a3)', borderRadius:'3px', transition:'width 0.5s' }} />
                      </div>
                    </div>

                    {project.tasks?.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {project.tasks.slice(0,3).map((task, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                            <span>{task.status === 'done' ? '✅' : task.status === 'inprogress' ? '🔄' : '⬜'}</span>
                            <span style={{ color: task.status === 'done' ? 'var(--muted)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
                          </div>
                        ))}
                        {project.tasks.length > 3 && <p style={{ fontSize:'12px', color:'var(--muted)', marginTop:'4px' }}>+{project.tasks.length - 3} more tasks</p>}
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'16px', paddingTop:'14px', borderTop:'1px solid var(--border)' }}>
                      <span style={{ fontSize:'12px', color:'var(--muted)' }}>👤 {project.manager?.name || 'N/A'}</span>
                      <span style={{ fontSize:'12px', color:'var(--muted)' }}>{done}/{total} tasks</span>
                    </div>
                    {isAssignedEmployee && (
                      <button type="button" className="btn-primary" onClick={() => completeProject(project._id)} style={{ width:'100%', marginTop:'14px', padding:'10px 12px', fontSize:'13px' }}>
                        Project Completed
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </main>
    </div>
  );
}
