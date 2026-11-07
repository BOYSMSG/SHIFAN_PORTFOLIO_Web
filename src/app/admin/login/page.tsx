'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [trustThisIp, setTrustThisIp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication rejected.');
        setLoading(false);
        return;
      }

      if (data.success || data.trustedIp || data.directLogin) {
        // Direct authorized login!
        setInfoMessage('Authentication successful! Welcome, Mohd Shifan. Redirecting to Owner Console...');
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 500);
        return;
      }

      if (data.requireOtp) {
        setStep('otp');
        setInfoMessage(data.message || 'Security code sent to your administrator email.');
        if (data.devOtp) {
          setDevOtpCode(data.devOtp);
        }
      }
    } catch {
      setError('Network communication failure. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email,
          otp,
          trustThisIp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid passcode.');
        setLoading(false);
        return;
      }

      setInfoMessage('Verification passed! Establishing secure session...');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 700);
    } catch {
      setError('Network error during passcode validation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-7 sm:p-9 relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-electric-blue/10 via-electric-cyan/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-electric-blue/30 shadow-md mb-4 bg-white p-1">
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image src="/assets/boysmsg.png" alt="Owner Emblem" fill className="object-cover" />
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-electric-blue bg-electric-ice px-2.5 py-0.5 rounded-full border border-electric-blue/20 mb-2">
              Private Owner Console
            </span>
            <h1 className="text-2xl font-extrabold text-midnight-900 tracking-tight">
              {step === 'credentials' ? 'Administrator Login' : 'Passcode Verification'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {step === 'credentials'
                ? 'Authorized access for Mohd Shifan Gouri. Master credentials verification.'
                : `Enter the 6-digit verification code sent to ${email}`}
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-electric-ice/70 border border-electric-blue/20 text-electric-blue text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-electric-blue" />
              <div className="leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {/* Dev Mode Notification Box (shows OTP if Resend is not configured yet) */}
          {devOtpCode && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Development Mode OTP Code:</span>
              </div>
              <div className="font-mono text-base font-extrabold tracking-widest text-midnight-900 bg-white p-2 rounded border border-amber-300 text-center select-all">
                {devOtpCode}
              </div>
              <p className="text-[10px] text-amber-700 mt-1.5">
                (Configure <code>RESEND_API_KEY</code> in production for live email delivery)
              </p>
            </div>
          )}

          {/* Step 1 Form: Email & Password */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-midnight-800">
                    Administrator Email
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmail('msgboys832@gmail.com')}
                    className="text-[10px] text-electric-blue hover:underline font-mono"
                  >
                    Quick fill: msgboys832@gmail.com
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="msgboys832@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-midnight-800">
                    Console Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('ShifanAdmin2026!')}
                    className="text-[10px] text-electric-blue hover:underline font-mono"
                  >
                    Fill default pass
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Click eye icon to check password</span>
                  <span className="font-mono text-[10px] text-electric-blue">PBKDF2 Protected</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Verification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2 Form: 6-Digit OTP Code */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-midnight-800 mb-1.5">
                  One-Time Security Passcode (6 digits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-lg font-mono tracking-widest text-center bg-slate-50 border border-slate-200 text-midnight-900 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="trustIp"
                  checked={trustThisIp}
                  onChange={(e) => setTrustThisIp(e.target.checked)}
                  className="w-4 h-4 rounded text-electric-blue focus:ring-electric-blue"
                />
                <label htmlFor="trustIp" className="cursor-pointer select-none text-[11px]">
                  Trust this network IP address for future logins
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-1/3 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-2/3 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security policy footnote */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              Encrypted with HMAC-SHA256 &bull; Strict SameSite HTTP-Only Cookie &bull; Auto-expiring sessions
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
