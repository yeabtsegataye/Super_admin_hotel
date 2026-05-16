
// UserDetailsPage.tsx - Add renewal functionality
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserDetails, blockUser, unblockUser, renewLicense, extendLicense } from '../services/authService';
import type { UserDetails } from '../types';

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalType, setRenewalType] = useState<'renew' | 'extend'>('renew');
  const [renewalData, setRenewalData] = useState({
    duration: 1,
    unit: 'month' as 'day' | 'month' | 'year',
    packageId: undefined as number | undefined,
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const response = await fetchUserDetails(Number(userId));
        setUser(response.data);
      } catch (error) {
        console.error('Failed to load user details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserDetails();
  }, [userId]);

  const handleRenewLicense = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const response = await renewLicense(user.id, renewalData);
      alert(`License renewed successfully! New expiry: ${new Date(response.data.newExpiry).toLocaleDateString()}`);
      setShowRenewalModal(false);
      // Reload user details
      const updatedUser = await fetchUserDetails(user.id);
      setUser(updatedUser.data);
    } catch (error) {
      console.error('Failed to renew license:', error);
      alert('Failed to renew license. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendLicense = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const response = await extendLicense(user.id, {
        extendBy: renewalData.duration,
        unit: renewalData.unit,
      });
      alert(`License extended successfully! New expiry: ${new Date(response.data.newExpiry).toLocaleDateString()}`);
      setShowRenewalModal(false);
      const updatedUser = await fetchUserDetails(user.id);
      setUser(updatedUser.data);
    } catch (error) {
      console.error('Failed to extend license:', error);
      alert('Failed to extend license. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (user.isBlocked) {
        await unblockUser(user.id);
        setUser({ ...user, isBlocked: false });
      } else {
        await blockUser(user.id);
        setUser({ ...user, isBlocked: true });
      }
    } catch (error) {
      console.error('Failed to toggle user block status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
        Loading user details...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center">
        <p className="text-slate-400">User not found</p>
        <button
          onClick={() => navigate('/users/expired')}
          className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 text-sm text-white"
        >
          Back to Expired Licenses
        </button>
      </div>
    );
  }

  const isExpired = user.licenceExpiryDate && new Date(user.licenceExpiryDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              {renewalType === 'renew' ? 'Renew License' : 'Extend License'}
            </h2>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm text-slate-400">Operation Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRenewalType('renew')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm ${
                    renewalType === 'renew'
                      ? 'bg-cyan-500 text-white'
                      : 'border border-slate-800 bg-slate-950/70 text-slate-300'
                  }`}
                >
                  Replace License
                </button>
                <button
                  onClick={() => setRenewalType('extend')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm ${
                    renewalType === 'extend'
                      ? 'bg-cyan-500 text-white'
                      : 'border border-slate-800 bg-slate-950/70 text-slate-300'
                  }`}
                >
                  Extend Existing
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {renewalType === 'renew' 
                  ? 'Replace the current license (even if still valid) with a new one' 
                  : 'Add time to the existing license without changing its start date'}
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-slate-400">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={renewalData.duration}
                  onChange={(e) => setRenewalData({ ...renewalData, duration: parseInt(e.target.value) || 1 })}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-white"
                />
                <select
                  value={renewalData.unit}
                  onChange={(e) => setRenewalData({ ...renewalData, unit: e.target.value as any })}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-white"
                >
                  <option value="day">Day(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm text-slate-400">Preview</label>
              <div className="rounded-xl bg-slate-950/70 p-3 text-sm">
                {renewalType === 'renew' ? (
                  <p>New license will expire on: <span className="text-cyan-400">
                    {new Date(new Date().setDate(new Date().getDate() + 
                      (renewalData.unit === 'day' ? renewalData.duration :
                       renewalData.unit === 'month' ? renewalData.duration * 30 :
                       renewalData.duration * 365)
                    )).toLocaleDateString()}
                  </span></p>
                ) : user.licenceExpiryDate && (
                  <p>Extended expiry: <span className="text-cyan-400">
                    {new Date(new Date(user.licenceExpiryDate).setDate(
                      new Date(user.licenceExpiryDate).getDate() +
                      (renewalData.unit === 'day' ? renewalData.duration :
                       renewalData.unit === 'month' ? renewalData.duration * 30 :
                       renewalData.duration * 365)
                    )).toLocaleDateString()}
                  </span></p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRenewalModal(false)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={renewalType === 'renew' ? handleRenewLicense : handleExtendLicense}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-900 hover:bg-cyan-400"
              >
                {actionLoading ? 'Processing...' : renewalType === 'renew' ? 'Renew License' : 'Extend License'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <div>
          <button
            onClick={() => navigate('/users/expired')}
            className="mb-2 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Expired Licenses
          </button>
          <h1 className="text-2xl font-semibold text-white">User Details</h1>
          <p className="mt-1 text-sm text-slate-400">View and manage user information</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setRenewalType('renew');
              setShowRenewalModal(true);
            }}
            className="rounded-2xl bg-cyan-500 px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-cyan-400"
          >
            Renew License
          </button>
          <button
            onClick={handleBlockToggle}
            disabled={actionLoading}
            className={`rounded-2xl px-6 py-2.5 font-semibold transition ${
              user.isBlocked
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
            }`}
          >
            {actionLoading ? 'Processing...' : user.isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Information */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">User Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">User ID:</span>
              <span className="text-white font-mono">{user.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Full Name:</span>
              <span className="text-white">{user.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Email:</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Phone:</span>
              <span className="text-white">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Role:</span>
              <span className="text-white capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Status:</span>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                user.isBlocked 
                  ? 'bg-red-900/50 text-red-300' 
                  : isExpired 
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : 'bg-green-900/50 text-green-300'
              }`}>
                {user.isBlocked ? 'Blocked' : isExpired ? 'License Expired' : 'Active'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Joined:</span>
              <span className="text-white">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* License Information */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">License Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">License Status:</span>
              <span className={`font-semibold ${
                isExpired || user.isBlocked ? 'text-red-400' : 'text-green-400'
              }`}>
                {user.isBlocked ? 'Blocked' : isExpired ? 'Expired' : 'Active'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Expiry Date:</span>
              <span className="text-white font-mono">
                {new Date(user.licenceExpiryDate).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Days Expired:</span>
              <span className="text-red-400">
                {Math.ceil((new Date().getTime() - new Date(user.licenceExpiryDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400 mb-2">License Key (JWT):</p>
              <p className="break-all font-mono text-xs text-slate-300">{user.licenceKey}</p>
            </div>
          </div>
        </div>

        {/* Hotels */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Hotels</h2>
          {user.hotels.length === 0 ? (
            <p className="text-slate-400">No hotels associated with this user</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.hotels.map((hotel) => (
                <div key={hotel.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="font-semibold text-white">{hotel.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{hotel.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}

      </div>
    </div>
  );
}