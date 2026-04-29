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
import AnticorruptionTraining from './pages/AnticorruptionTraining.jsx';
import ProcedureDetail from './pages/ProcedureDetail.jsx';
import Requests from './pages/Requests.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Announcements from './pages/Announcements.jsx';
import Shifts from './pages/Shifts.jsx';
import Maintenance from './pages/Maintenance.jsx';
import ProductionReport from './pages/ProductionReport.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import Agreements from './pages/Agreements.jsx';
import AgreementDetail from './pages/AgreementDetail.jsx';
import Lhc from './pages/Lhc.jsx';
import LhcCampaignNew from './pages/LhcCampaignNew.jsx';
import LhcCampaignDetail from './pages/LhcCampaignDetail.jsx';
import LhcAnswer from './pages/LhcAnswer.jsx';
import LhcResults from './pages/LhcResults.jsx';
import LhcMyResult from './pages/LhcMyResult.jsx';
import LhcQuestionsAdmin from './pages/LhcQuestionsAdmin.jsx';

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
            <Route path="/trainings/anticorruption" element={<AnticorruptionTraining />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/production-report" element={<ProductionReport />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/agreements/:id" element={<AgreementDetail />} />
            <Route path="/lhc" element={<Lhc />} />
            <Route path="/lhc/campaigns/new" element={<LhcCampaignNew />} />
            <Route path="/lhc/campaigns/:id" element={<LhcCampaignDetail />} />
            <Route path="/lhc/campaigns/:id/answer" element={<LhcAnswer />} />
            <Route path="/lhc/campaigns/:id/results" element={<LhcResults />} />
            <Route path="/lhc/campaigns/:id/my-result" element={<LhcMyResult />} />
            <Route path="/lhc/admin/questions" element={<LhcQuestionsAdmin />} />
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
