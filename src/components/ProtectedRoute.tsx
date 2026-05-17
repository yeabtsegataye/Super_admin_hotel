// components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthVerification } from '../hooks/useAuthVerification';

export default function ProtectedRoute() {
  const { isVerified, isLoading } = useAuthVerification();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Show loading indicator
  }

  return isVerified ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}