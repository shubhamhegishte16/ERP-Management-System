import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import Kanban from './pages/Kanban';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Team from './pages/manager/Team';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Activity from './pages/employee/Activity';
import Privacy from './pages/employee/Privacy';
import Projects from './pages/Projects';
import AdminDashboard from './components/AdminDashboard';
import AdminAllData from './pages/AdminAllData';

const getHomeRoute = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager';
  return '/employee';
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0a0f' }}>
        <div className="spinner" style={{ width:'40px', height:'40px' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={getHomeRoute(user.role)} replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? getHomeRoute(user.role) : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['admin']}><Projects /></ProtectedRoute>} />
      <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={['admin']}><Kanban /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={['admin']}><Team /></ProtectedRoute>} />
      <Route path="/admin/all-data" element={<ProtectedRoute allowedRoles={['admin']}><AdminAllData /></ProtectedRoute>} />

      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/team" element={<ProtectedRoute allowedRoles={['manager']}><Team /></ProtectedRoute>} />
      <Route path="/manager/projects" element={<ProtectedRoute allowedRoles={['manager']}><Projects /></ProtectedRoute>} />
      <Route path="/manager/tasks" element={<ProtectedRoute allowedRoles={['manager']}><Kanban /></ProtectedRoute>} />
      <Route path="/manager/attendance" element={<ProtectedRoute allowedRoles={['manager']}><Attendance /></ProtectedRoute>} />

      <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/activity" element={<ProtectedRoute allowedRoles={['employee']}><Activity /></ProtectedRoute>} />
      <Route path="/employee/projects" element={<ProtectedRoute allowedRoles={['employee']}><Projects /></ProtectedRoute>} />
      <Route path="/employee/tasks" element={<ProtectedRoute allowedRoles={['employee']}><Kanban /></ProtectedRoute>} />
      <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={['employee']}><Attendance /></ProtectedRoute>} />
      <Route path="/employee/privacy" element={<ProtectedRoute allowedRoles={['employee']}><Privacy /></ProtectedRoute>} />

      <Route path="/manager/kanban" element={<Navigate to="/manager/tasks" replace />} />
      <Route path="/employee/kanban" element={<Navigate to="/employee/tasks" replace />} />
      <Route path="/admin/kanban" element={<Navigate to="/admin/tasks" replace />} />

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
