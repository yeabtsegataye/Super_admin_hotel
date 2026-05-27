import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import CryptoJS from 'crypto-js';
import { useLoginMutation } from '../features/auth/authApiSlice.js';
import { setCredentials } from '../features/auth/authSlice.js';

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login] = useLoginMutation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const validateEmail = (value: string) => {
    const emailValid = value.match(/^([\w.%+-]+)@([\w-]{2,}\.)+([\w]{2,})$/i);
    setEmailError(emailValid ? "" : "Email is invalid");
    setFormValid(!!emailValid);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    
    if (formValid) {
      setLoading(true);
      
      try {
        // Encrypt the password
        const encryptedPassword = CryptoJS.AES.encrypt(
          password,
          SECRET_KEY
        ).toString();

        const userData = await login({
          email,
          Password: encryptedPassword,
        }).unwrap();
        
        if (userData) {
          dispatch(setCredentials(userData));
          navigate(from, { replace: true });
        }
      } catch (err: any) {
        setError(err?.data?.message || err?.data || "Login failed. Check your email and password.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a valid email address");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/90">Super Admin</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Sign in to your dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Secure access to packages, analytics, payments, and security tools.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              className={`mt-3 w-full rounded-3xl border ${
                emailError ? 'border-red-500' : 'border-slate-800'
              } bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20`}
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={6}
              className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>

          <div className="text-right mt-2">
            <a href="/forgot_password" className="text-sm text-cyan-400 hover:underline">
              Forgot Password?
            </a>
          </div>

          {(error || emailError) && <p className="text-sm text-rose-400">{error || emailError}</p>}

          <button
            type="submit"
            disabled={!formValid || loading}
            className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>


      </div>
    </div>
  );
}