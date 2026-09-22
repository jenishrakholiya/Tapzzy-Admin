'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid credentials');
        return;
      }

      router.push(returnUrl);
      router.refresh();
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillQuickCredentials() {
    setUsername('admin');
    setPassword('admin123456');
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top Simple Bar */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs font-heading">
            T
          </div>
          <span className="font-extrabold tracking-tight text-white text-sm font-heading">
            tapyy
          </span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-sm mx-auto w-full my-auto animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">
              Admin Login
            </h1>
            <p className="text-xs text-slate-400">
              Sign in to manage stands, cards, and customer reviews.
            </p>
          </div>

          {/* Quick Credential Helper */}
          <button
            type="button"
            onClick={fillQuickCredentials}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3 h-3 text-amber-400" /> Auto-fill Demo
            </span>
            <span className="text-amber-400 font-mono font-bold">
              admin / admin123456
            </span>
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-3">
        © 2026 Tapyy
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
