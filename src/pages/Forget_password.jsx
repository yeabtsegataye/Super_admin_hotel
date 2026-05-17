import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSendResetCodeMutation, useResetPasswordMutation } from "../features/auth/authApiSlice";
import validator from "validator";
import DOMPurify from "dompurify";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [isCodeDisabled, setIsCodeDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sendResetCode] = useSendResetCodeMutation();
  const [resetPassword] = useResetPasswordMutation();

  // Validate email format
  const validateEmail = (email) => {
    return validator.isEmail(email);
  };

  // Sanitize inputs
  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input.trim());
  };

  // Handle sending reset code
  const handleSendCode = async () => {
    setError("");
    setSuccess("");
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendResetCode(email).unwrap();
      console.log("OTP Response:", response);
      setSuccess("Reset code sent! Check your email.");
      setIsCodeDisabled(true);
      setCooldown(60);
      setIsDisabled(false);
    } catch (err) {
      setError(err?.data?.message || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resetting password
  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedOtp = sanitizeInput(otp);
      const sanitizedPassword = sanitizeInput(newPassword);

      await resetPassword({ 
        email: sanitizedEmail, 
        otp: sanitizedOtp, 
        newPassword: sanitizedPassword 
      }).unwrap();
      
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cooldown timer for the "Send Reset Code" button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setIsCodeDisabled(false);
    }
  }, [cooldown]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/90">Super Admin</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Forgot Password?</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email to receive a reset code
          </p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Email field with send code button */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Enter your email"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isCodeDisabled || !email || cooldown > 0 || isLoading}
                className="rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
              >
                {isLoading && !isDisabled ? (
                  "Sending..."
                ) : cooldown > 0 ? (
                  `${cooldown}s`
                ) : (
                  "Send Code"
                )}
              </button>
            </div>
          </div>

          {/* Reset Code field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Reset Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setCode(e.target.value)}
              disabled={isDisabled}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter 6-digit code"
            />
          </div>

          {/* New Password field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isDisabled}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter new password (min. 8 characters)"
            />
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isDisabled}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Confirm your new password"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-sm text-emerald-400">{success}</p>
            </div>
          )}

          {/* Reset Password Button */}
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isDisabled || !otp || !newPassword || !confirmPassword || isLoading}
            className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Reset Password"}
          </button>

          {/* Back to Login Link */}
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-cyan-400 hover:underline">
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;