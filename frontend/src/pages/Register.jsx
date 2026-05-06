import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name:'',
    email:'',
    password:'',
    manager:'',
    department:'',
    registrationDate:new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/managers')
      .then((res) => {
        setManagers(res.data.managers);
        setForm((current) => ({
          ...current,
          manager: current.manager || res.data.managers[0]?._id || '',
        }));
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/employee');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'440px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <h1 style={{ fontFamily:'Syne', fontSize:'28px', fontWeight:800 }} className="grad-text">WorkPulse</h1>
          <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:'8px' }}>Create your employee account</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily:'Syne', fontSize:'22px', fontWeight:700, marginBottom:'12px' }}>Register</h2>
          <p style={{ color:'var(--muted)', fontSize:'14px', marginBottom:'24px' }}>Registration is only for employees. Admin and manager accounts are permanent.</p>

          {error && (
            <div style={{ background:'rgba(255,92,135,0.1)', border:'1px solid rgba(255,92,135,0.3)', borderRadius:'8px', padding:'12px', marginBottom:'20px', fontSize:'14px', color:'#ff5c87' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label>Name</label>
              <input {...f('name')} placeholder="Your full name" required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" {...f('email')} placeholder="you@company.com" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" {...f('password')} placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div>
              <label>Manager</label>
              <select {...f('manager')} required>
                <option value="">Select manager</option>
                {managers.map((manager) => <option key={manager._id} value={manager._id}>{manager.name}</option>)}
              </select>
            </div>
            <div>
              <label>Department</label>
              <input {...f('department')} placeholder="Engineering" />
            </div>
            <div>
              <label>Registration Date</label>
              <input type="date" {...f('registrationDate')} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop:'8px', width:'100%', padding:'12px' }}>
              {loading ? <span className="spinner" /> : 'Create Account ->'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent1)', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
