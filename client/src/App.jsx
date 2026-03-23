import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectCreate from './pages/ProjectCreate.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import PODetail from './pages/PODetail.jsx';
import Procedures from './pages/Procedures.jsx';
import Trainings from './pages/Trainings.jsx';
import ProcedureDetail from './pages/ProcedureDetail.jsx';
import Requests from './pages/Requests.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Announcements from './pages/Announcements.jsx';
import Shifts from './pages/Shifts.jsx';
import Maintenance from './pages/Maintenance.jsx';
import ProductionReport from './pages/ProductionReport.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/po/:id"       element={<PODetail />} />
            <Route path="/register" element={<Register />} />
            <Route path="/procedures" element={<Procedures />} />
            <Route path="/procedures/:id" element={<ProcedureDetail />} />
            <Route path="/trainings" element={<Trainings />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/production-report" element={<ProductionReport />} />
          </Route>

          {/* Owner / Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
            <Route path="/projects/new" element={<ProjectCreate />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
      <Toaster position="top-right" />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
