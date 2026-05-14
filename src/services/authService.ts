import api from './api';
import type { AuthCredentials, SignupCredentials } from '../types';

export const signup = (payload: SignupCredentials) => {
  const res = api.post('/super/register', {
    ...payload,
  });
  console.log('Signup response:', res);
  return res;
};

export const login = (payload: AuthCredentials) => {
  return api.post('/super/login', {
    ...payload,
  });
};

export const fetchSummary = () => api.get('/super/summary');
export const fetchSubscribers = () => api.get('/super/subscribers');
export const fetchUsers = () => api.get('/super/users');
export const fetchPackages = () => api.get('/super/packages');
export const fetchPayments = () => api.get('/super/payments');
export const fetchAudit = () => api.get('/super/security-audit');
export const createPackage = (payload: Record<string, unknown>) => api.post('/packeage/create', payload);
export const updatePackage = (id: number, payload: Partial<Record<string, unknown>>) =>
  api.put(`/super/package/${id}`, payload);
export const deletePackage = (id: number) => api.delete(`/packeage/${id}`);
export const blockUser = (id: number) => api.post(`/super/block-user/${id}`);
export const unblockUser = (id: number) => api.post(`/super/unblock-user/${id}`);
