import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "./layout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPassword from "./pages/Forget_password"; // Import the ForgotPassword component
import OverviewPage from "./pages/OverviewPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import ManagePackagesPage from "./pages/ManagePackagesPage";
import ExpiredLicensesPage from "./pages/ExpiredLicensesPage";
import PaymentsPage from "./pages/PaymentsPage";
import SecurityPage from "./pages/SecurityPage";
import NotFoundPage from "./pages/NotFoundPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import useRefreshToken from "./hooks/useRefreshToken";
import verifyToken from "./middleware/verifiToken";

function App() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const refresh = useRefreshToken();
  const dispatch = useDispatch();
  const [isVerified, setIsVerified] = useState(false);
  const token = useSelector((state: any) => state.auth.token);
  const isAuthenticated = useSelector(
    (state: any) => state.auth.token !== null,
  );

  useEffect(() => {
    if (isInitialLoad) {
      refresh();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, refresh]);

  const verified = async () => {
    const Is_Verified = await verifyToken(token, dispatch, refresh);
    setIsVerified(Is_Verified);
    console.log("Token verification result:", Is_Verified);
    console.log("Current token:", isAuthenticated);
  };
  verified();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              replace
              to={isVerified  ? "/dashboard" : "/login"}
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />{" "}
        {/* Add this line */}
        <Route
          element={
            <ProtectedRoute
              isVerified={isVerified}
              isAuthenticated={isAuthenticated}
            />
          }
        >
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
