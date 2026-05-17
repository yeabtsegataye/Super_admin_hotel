// components/RouteGuard.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthVerification } from '../hooks/useAuthVerification';

export const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isVerified, isLoading } = useAuthVerification();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state: any) => state.auth.token);

  useEffect(() => {
    if (!isLoading) {
      if (!isVerified || !token) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
    }
  }, [isVerified, isLoading, navigate, token, location]);

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return isVerified && token ? <>{children}</> : null;
};