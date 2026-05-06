import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getHomeRoute = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager';
  return '/employee';
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'employee', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setRole = (role) => {
    setForm({ role, email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form.email, form.password, form.role);
      navigate(getHomeRoute(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <h1 style={{ fontFamily:'Syne', fontSize:'28px', fontWeight:800 }} className="grad-text">WorkPulse</h1>
          <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'8px' }}>AI-Powered Employee Intelligence</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily:'Syne', fontSize:'22px', fontWeight:700, marginBottom:'24px' }}>Sign In</h2>

          {error && (
            <div style={{ background:'rgba(255,92,135,0.1)', border:'1px solid rgba(255,92,135,0.3)', borderRadius:'8px', padding:'12px', marginBottom:'20px', fontSize:'14px', color:'#ff5c87' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label>Login As</label>
              <select value={form.role} onChange={e => setRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop:'8px', width:'100%', padding:'12px' }}>
              {loading ? <span className="spinner" /> : 'Sign In ->'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'var(--muted)' }}>
            No employee account?{' '}
            <Link to="/register" style={{ color:'var(--accent1)', textDecoration:'none', fontWeight:600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
