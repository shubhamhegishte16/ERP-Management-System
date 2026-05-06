import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const emptyData = {
  users: [],
  projects: [],
  activities: [],
  productivity: [],
};

const DataTable = ({ title, rows, columns }) => (
  <div className="card" style={{ overflow:'hidden' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
      <p style={{ fontFamily:'Syne', fontSize:'13px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px' }}>{title}</p>
      <span style={{ fontSize:'12px', color:'var(--muted)' }}>{rows.length} records</span>
    </div>
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'720px' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid var(--border)' }}>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row._id || index} style={{ borderBottom:'1px solid var(--border)' }}>
              {columns.map((column) => (
                <td key={column.key} style={{ padding:'11px 10px', fontSize:'13px', color:'var(--text)', verticalAlign:'top' }}>
                  {column.render ? column.render(row) : row[column.key] || '-'}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} style={{ padding:'18px 10px', color:'var(--muted)', fontSize:'13px' }}>
                No data yet. New activity and registrations will appear here while the backend is running.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const shortId = (id) => id ? String(id).slice(0, 8) : '-';
const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN') : '-';
const formatSeconds = (value) => `${Math.round((Number(value) || 0) / 60)} min`;

export default function AdminAllData() {
  const { user } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/all-data');
        setData(res.data.data || emptyData);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => ([
    { label: 'Users', value: data.users.length },
    { label: 'Projects', value: data.projects.length },
    { label: 'Activities', value: data.activities.length },
    { label: 'Productivity Rows', value: data.productivity.length },
  ]), [data]);

  if (loading) {
    return (
      <div style={{ display:'flex', minHeight:'100vh' }}>
        <Sidebar role={user?.role || 'admin'} />
        <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="spinner" style={{ width:'36px', height:'36px' }} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar role={user?.role || 'admin'} />
      <main style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <div style={{ marginBottom:'24px' }}>
          <h2 style={{ fontFamily:'Syne', fontSize:'26px', fontWeight:800 }}>All Data</h2>
          <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'4px' }}>In-memory records currently available to the admin panel.</p>
        </div>

        {error && (
          <div className="card" style={{ borderColor:'rgba(255,92,135,0.35)', color:'var(--accent2)', marginBottom:'20px' }}>
            {error}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'16px', marginBottom:'24px' }}>
          {totals.map((item) => (
            <div key={item.label} className="card">
              <p style={{ color:'var(--muted)', fontSize:'12px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{item.label}</p>
              <p style={{ fontFamily:'Syne', fontSize:'28px', fontWeight:800 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gap:'18px' }}>
          <DataTable
            title="Users"
            rows={data.users}
            columns={[
              { key:'_id', label:'ID', render:(row) => shortId(row._id) },
              { key:'name', label:'Name' },
              { key:'email', label:'Email' },
              { key:'role', label:'Role' },
              { key:'department', label:'Department' },
              { key:'createdAt', label:'Created', render:(row) => formatDate(row.createdAt) },
            ]}
          />

          <DataTable
            title="Projects"
            rows={data.projects}
            columns={[
              { key:'_id', label:'ID', render:(row) => shortId(row._id) },
              { key:'name', label:'Name' },
              { key:'status', label:'Status' },
              { key:'team', label:'Team Size', render:(row) => row.team?.length || 0 },
              { key:'tasks', label:'Tasks', render:(row) => row.tasks?.length || 0 },
              { key:'completionPercent', label:'Complete', render:(row) => `${row.completionPercent || 0}%` },
            ]}
          />

          <DataTable
            title="Activities"
            rows={data.activities}
            columns={[
              { key:'_id', label:'ID', render:(row) => shortId(row._id) },
              { key:'user', label:'User ID', render:(row) => shortId(row.user) },
              { key:'appName', label:'App' },
              { key:'category', label:'Category' },
              { key:'durationSeconds', label:'Duration', render:(row) => formatSeconds(row.durationSeconds) },
              { key:'date', label:'Date', render:(row) => formatDate(row.date) },
            ]}
          />

          <DataTable
            title="Productivity"
            rows={data.productivity}
            columns={[
              { key:'_id', label:'ID', render:(row) => shortId(row._id) },
              { key:'user', label:'User ID', render:(row) => shortId(row.user) },
              { key:'score', label:'Score', render:(row) => `${row.score || 0}%` },
              { key:'focusScore', label:'Focus', render:(row) => `${row.focusScore || 0}%` },
              { key:'burnoutRisk', label:'Risk' },
              { key:'date', label:'Date', render:(row) => formatDate(row.date) },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
