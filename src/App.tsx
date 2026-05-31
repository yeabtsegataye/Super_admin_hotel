// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import AdminLayout from "./layout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/Forget_password.jsx";
import OverviewPage from "./pages/OverviewPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import ManagePackagesPage from "./pages/ManagePackagesPage";
import LicensingPage from "./pages/LicensingPage";
import PaymentsPage from "./pages/PaymentsPage";
import SecurityPage from "./pages/SecurityPage";
import NotFoundPage from "./pages/NotFoundPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ReferralsPage from "./pages/ReferralsPage";
import useRefreshToken from "./hooks/useRefreshToken";

function App() {
  const refresh = useRefreshToken();
  const token = useSelector((state: any) => state.auth.token);

  // Only refresh on initial load if token exists
  useEffect(() => {
    if (token) {
      refresh();
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              replace
              to={token ? "/dashboard" : "/login"}
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/users" element={<ManageUsersPage />} />
            <Route path="/licensing" element={<LicensingPage />} />
            <Route path="users/:userId" element={<UserDetailsPage />} />
            <Route path="/packages" element={<ManagePackagesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;