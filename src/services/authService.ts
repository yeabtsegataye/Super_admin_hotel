import api from './api';
import type { AuthCredentials, SignupCredentials } from '../types';

export const signup = (payload: SignupCredentials) => {
  const res = api.post('/super/register', {
    ...payload,
  });
  console.log('Signup response:', res);
  return res;
};
// services/authService.ts
export const getBatchLicenseInfo = async (userIds: number[]) => {
  const response = await api.post('/super/users/license-info/batch', { userIds });
  return response;
};
export const login = (payload: AuthCredentials) => {
  return api.post('/super/login', {
    ...payload,
  });
};
// services/authService.ts
export const fetchUserDetails = async (userId: number) => {
  const response = await api.get(`/super/users/${userId}`);
  return response;
};
// services/authService.ts
export const renewLicense = async (userId: number, data: {
  duration: number;
  unit: 'day' | 'month' | 'year';
  packageId?: number;
}) => {
  const response = await api.post(`/super/users/${userId}/renew-license`, data);
  console.log('the data', data);
  return response;
};

export const extendLicense = async (userId: number, data: {
  extendBy: number;
  unit: 'day' | 'month' | 'year';
}) => {
  const response = await api.post(`/super/users/${userId}/extend-license`, data);
  return response;
};

export const getLicenseInfo = async (userId: number) => {
  const response = await api.get(`/super/users/${userId}/license-info`);
  return response;
};

export const bulkRenewLicenses = async (userIds: number[], duration: number, unit: 'day' | 'month' | 'year') => {
  const response = await api.post('/super/licenses/bulk-renew', { userIds, duration, unit });
  return response;
};

export const fetchExpiredLicensesDetailed = async () => {
  const response = await api.get('/super/expired-licenses/detailed');
  return response;
};
export const fetchSummary = () => api.get('/super/summary');
export const fetchSubscribers = () => api.get('/super/subscribers');
export const fetchExpiredLicenses = () => api.get('/super/expired-licenses');
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
// Impersonate a user (super-admin only)
export const impersonateUser = (id: number) => api.post(`/super/users/${id}/impersonate`);
