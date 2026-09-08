import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setShakeKey((k) => k + 1); // retriggers the shake animation
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white ' +
    'placeholder-slate-500 outline-none transition-all duration-300 ' +
    'hover:border-white/20 focus:border-purple-400 focus:bg-white/[0.06] focus:ring-4 focus:ring-purple-500/15';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 text-slate-100 sm:p-6">
      {/* Ambient animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-24 -top-32 h-96 w-96 rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="animate-float-slower absolute -bottom-36 -right-20 h-[26rem] w-[26rem] rounded-full bg-pink-600/20 blur-[130px]" />
        <div className="animate-float-slow absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)]" />
      </div>

      <div className="animate-fade-up relative w-full max-w-4xl">
        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-purple-950/40 backdrop-blur-xl md:grid-cols-5">
          {/* Brand panel */}
          <div className="animate-gradient-x relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 p-8 md:col-span-2 md:flex">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_45%)]"
            />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <Music className="h-6 w-6 text-white" />
              </span>
              <div>
                <p className="text-sm font-black tracking-tight text-white">KhmerBeats</p>
                <p className="text-[11px] font-medium text-white/75">Admin CMS</p>
              </div>
            </div>

            <div className="animate-float-slow relative my-6">
              <Music className="h-36 w-36 text-white/15" strokeWidth={1.2} />
              <div className="absolute right-6 top-8 h-2.5 w-2.5 animate-pulse rounded-full bg-white/60" />
              <div
                className="absolute -bottom-1 right-16 h-2 w-2 animate-pulse rounded-full bg-white/40"
                style={{ animationDelay: '-0.6s' }}
              />
            </div>

            <div className="relative">
              <h2 className="text-2xl font-black leading-tight text-white">គ្រប់គ្រងហាងតន្ត្រីរបស់អ្នក</h2>
              <p className="mt-1 text-xs text-white/80">Music, promos &amp; orders — all in one place.</p>
              <div className="mt-6 flex h-8 items-end gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span
                    key={i}
                    className="animate-eq w-1 origin-bottom rounded-full bg-white/80"
                    style={{ height: '100%', animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="animate-fade-up-delay-2 p-6 sm:p-10 md:col-span-3">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-300">Admin Access</span>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-300 ring-1 ring-white/10 md:hidden">
                <Music className="h-5 w-5" />
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-400">Login to the KhmerBeats admin dashboard</p>

            {error && (
              <div
                key={shakeKey}
                role="alert"
                className="animate-shake mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-xs text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-300">
                  Username / ឈ្មោះអ្នកប្រើ
                </span>
                <span className="group relative flex items-center">
                  <User className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500 transition-colors duration-300 group-focus-within:text-purple-400" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your admin username"
                    className={fieldCls}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-300">
                  Password / ពាក្យសម្ងាត់
                </span>
                <span className="group relative flex items-center">
                  <Lock className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500 transition-colors duration-300 group-focus-within:text-purple-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${fieldCls} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors duration-300 hover:bg-white/5 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-sm font-bold text-white shadow-lg shadow-purple-900/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-800/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Logging in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secured with JWT • KhmerBeats Music Store
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
