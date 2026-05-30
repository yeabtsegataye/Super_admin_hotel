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
  const [showPassword, setShowPassword] = useState(false);

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
            <div className="relative mt-3">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 pr-12 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition">
                {showPassword
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
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