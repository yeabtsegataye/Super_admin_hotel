import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isVerified: boolean;
  isAuthenticated: boolean;
}

export default function ProtectedRoute({ isVerified, isAuthenticated }: ProtectedRouteProps) {
  console.log("ProtectedRoute - isVerified:", isVerified, "isAuthenticated:", isAuthenticated);
  return isVerified && isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}