// hooks/useAuthVerification.ts
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut, setCredentials } from '../features/auth/authSlice';
import verifyToken from '../middleware/verifiToken';
import useRefreshToken from './useRefreshToken';

export const useAuthVerification = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const refresh = useRefreshToken();
  const token = useSelector((state: any) => state.auth.token);

  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsVerified(false);
      setIsLoading(false);
      return;
    }

    try {
      const verified = await verifyToken(token, dispatch, refresh);
      setIsVerified(verified);
      
      if (!verified) {
        dispatch(logOut());
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      setIsVerified(false);
      dispatch(logOut());
      navigate('/login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [token, dispatch, refresh, navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { isVerified, isLoading };
};