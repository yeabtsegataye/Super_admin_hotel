import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OverviewPage from './pages/OverviewPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManagePackagesPage from './pages/ManagePackagesPage';
import ExpiredLicensesPage from './pages/ExpiredLicensesPage';
import PaymentsPage from './pages/PaymentsPage';
import SecurityPage from './pages/SecurityPage';
import NotFoundPage from './pages/NotFoundPage';
import UserDetailsPage from './pages/UserDetailsPage';

function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to={auth.isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/users" element={<ManageUsersPage />} />
            <Route path="/users/expired" element={<ExpiredLicensesPage />} />
              <Route path="users/:userId" element={<UserDetailsPage />} />
            <Route path="/packages" element={<ManagePackagesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/security" element={<SecurityPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
