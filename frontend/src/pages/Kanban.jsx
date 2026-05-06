import { useEffect, useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const COLUMNS = [
  { id:'todo', label:'📋 To Do', color:'#7b7a99' },
  { id:'inprogress', label:'🔄 In Progress', color:'#6c63ff' },
  { id:'review', label:'👀 In Review', color:'#ffb347' },
  { id:'done', label:'✅ Done', color:'#00d9a3' },
];

const priorityColor = { high:'#ff5c87', medium:'#ffb347', low:'#00d9a3' };
const tagColor = { Frontend:'rgba(108,99,255,0.2)', Backend:'rgba(255,92,135,0.2)', Product:'rgba(0,217,163,0.2)', DevOps:'rgba(255,179,71,0.2)', QA:'rgba(168,157,255,0.2)' };

export default function Kanban() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title:'', projectId:'', assignee:'', priority:'medium' });

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const canDeleteTasks = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, peopleRes] = await Promise.all([
          api.get('/projects'),
          isManager ? api.get('/analytics/summary') : Promise.resolve({ data: { summary: [] } }),
        ]);

        const loadedProjects = projectsRes.data.projects;
        setProjects(loadedProjects);

        if (isManager) {
          const employeeList = peopleRes.data.summary
            .map(item => item.user)
            .filter(person => user?.role === 'admin'
              ? person.role === 'employee' || person.role === 'manager'
              : person.role === 'employee');
          setEmployees(employeeList);
          setNewTask(current => ({
            ...current,
            projectId: current.projectId || loadedProjects[0]?._id || '',
            assignee: current.assignee || employeeList[0]?._id || '',
          }));
        }
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, [isManager]);

  const allTasks = projects.flatMap(project => (
    (project.tasks || [])
      .filter(task => user?.role !== 'employee' || task.assignedTo?._id === user?._id)
      .map(task => ({
        id: task._id,
        title: task.title,
        assignee: task.assignedTo?.name || '',
        priority: task.estimatedHours > 8 ? 'high' : task.estimatedHours > 3 ? 'medium' : 'low',
        column: task.status === 'inprogress' ? 'inprogress' : task.status,
        tag: project.name,
        projectId: project._id,
      }))
  ));

  const syncProjectTasks = async (projectId, taskUpdater) => {
    const project = projects.find(item => item._id === projectId);
    if (!project) return;

    const updatedTasks = taskUpdater(project.tasks || []);
    const { data } = await api.put(`/projects/${projectId}`, { tasks: updatedTasks });
    setProjects(projects.map(item => item._id === projectId ? data.project : item));
  };

  const onDragStart = (task) => setDragging(task);
  const onDragOver = (e, colId) => {
    e.preventDefault();
    setDragOver(colId);
  };

  const onDrop = async (colId) => {
    if (!dragging) return;

    const nextStatus = colId === 'review' ? 'inprogress' : colId;
    await syncProjectTasks(dragging.projectId, (tasks) => tasks.map(task => (
      String(task._id) === String(dragging.id) ? { ...(task.toObject?.() || task), status: nextStatus } : (task.toObject?.() || task)
    )));

    setDragging(null);
    setDragOver(null);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId || !newTask.assignee) return;

    await syncProjectTasks(newTask.projectId, (tasks) => [
      ...tasks.map(task => task.toObject?.() || task),
      {
        title: newTask.title,
        assignedTo: newTask.assignee,
        status: 'todo',
        estimatedHours: newTask.priority === 'high' ? 10 : newTask.priority === 'medium' ? 5 : 2,
        loggedHours: 0,
      },
    ]);

    setNewTask({ title:'', projectId: projects[0]?._id || '', assignee: employees[0]?._id || '', priority:'medium' });
    setShowForm(false);
  };

  const deleteTask = async (task) => {
    await syncProjectTasks(task.projectId, (tasks) => tasks.filter(item => String(item._id) !== String(task.id)).map(item => item.toObject?.() || item));
  };

  const inp = { background:'#1a1a28', border:'1px solid rgba(255,255,255,0.08)', color:'#f0eeff', borderRadius:'8px', padding:'8px 12px', width:'100%', outline:'none', fontSize:'13px' };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
          <div>
            <h2 style={{ fontSize:'26px', fontWeight:800, color:'#f0eeff' }}>Tasks Board</h2>
            <p style={{ color:'#7b7a99', fontSize:'14px', marginTop:'4px' }}>{allTasks.length} tasks across {COLUMNS.length} columns</p>
          </div>
          {isManager && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Task</button>}
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom:'24px' }}>
            <h3 style={{ fontWeight:700, color:'#f0eeff', marginBottom:'16px' }}>New Task</h3>
            <form onSubmit={addTask} style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1fr auto', gap:'12px', alignItems:'end' }}>
              <div>
                <label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Task Title</label>
                <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title:e.target.value })} placeholder="Enter task..." style={inp} required />
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Project</label>
                <select value={newTask.projectId} onChange={e => setNewTask({ ...newTask, projectId:e.target.value })} style={inp}>
                  <option value="">Select project</option>
                  {projects.map(project => <option key={project._id} value={project._id}>{project.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Employee Assign</label>
                <select value={newTask.assignee} onChange={e => setNewTask({ ...newTask, assignee:e.target.value })} style={inp}>
                  <option value="">Select employee</option>
                  {employees.map(employee => <option key={employee._id} value={employee._id}>{employee.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'#7b7a99', display:'block', marginBottom:'4px' }}>Priority</label>
                <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority:e.target.value })} style={inp}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <button className="btn-primary" type="submit" style={{ padding:'8px 20px' }}>Add</button>
            </form>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', alignItems:'start' }}>
          {COLUMNS.map((col) => {
            const colTasks = allTasks.filter(task => task.column === col.id);
            return (
              <div
                key={col.id}
                onDragOver={isManager ? e => onDragOver(e, col.id) : undefined}
                onDrop={isManager ? () => onDrop(col.id) : undefined}
                style={{ background: dragOver === col.id ? 'rgba(108,99,255,0.05)' : '#12121a', border:`1px solid ${dragOver === col.id ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:'14px', padding:'16px', minHeight:'200px', transition:'all 0.2s' }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                  <p style={{ fontSize:'13px', fontWeight:700, color:col.color }}>{col.label}</p>
                  <span style={{ fontSize:'11px', background:'rgba(255,255,255,0.08)', color:'#7b7a99', padding:'2px 8px', borderRadius:'999px', fontWeight:600 }}>{colTasks.length}</span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={isManager}
                      onDragStart={isManager ? () => onDragStart(task) : undefined}
                      style={{ background:'#1a1a28', borderRadius:'10px', padding:'14px', cursor:isManager ? 'grab' : 'default', border:'1px solid rgba(255,255,255,0.06)', transition:'transform 0.1s', userSelect:'none' }}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'#f0eeff', lineHeight:1.4, flex:1 }}>{task.title}</p>
                        {canDeleteTasks && <button onClick={() => deleteTask(task)} style={{ background:'none', border:'none', color:'#7b7a99', cursor:'pointer', fontSize:'14px', padding:'0 0 0 8px', lineHeight:1 }}>x</button>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'999px', background: tagColor[task.tag] || 'rgba(255,255,255,0.1)', color:'#f0eeff', fontWeight:600 }}>{task.tag}</span>
                        <span style={{ fontSize:'10px', fontWeight:700, color: priorityColor[task.priority] }}>• {task.priority}</span>
                      </div>
                      {task.assignee && <p style={{ fontSize:'11px', color:'#7b7a99', marginTop:'8px' }}>👤 {task.assignee}</p>}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px', color:'#7b7a99', fontSize:'13px', border:'2px dashed rgba(255,255,255,0.06)', borderRadius:'8px' }}>
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
