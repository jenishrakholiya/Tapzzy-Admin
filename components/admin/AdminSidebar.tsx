'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  BarChart3,
  MessageSquare,
  ExternalLink,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If on login page, do not show sidebar
  if (pathname === '/admin/login') {
    return null;
  }

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: BarChart3,
      exact: true,
      badgeColor: 'text-amber-400',
    },
    {
      label: 'Businesses',
      href: '/admin/businesses',
      icon: Building2,
      badgeColor: 'text-blue-400',
    },
    {
      label: 'Physical Cards',
      href: '/admin/cards',
      icon: CreditCard,
      badgeColor: 'text-emerald-400',
    },
    {
      label: 'Reviews & Feedback',
      href: '/admin/reviews',
      icon: MessageSquare,
      badgeColor: 'text-purple-400',
    },
  ];

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-extrabold text-base tracking-tight">Tapyy Admin</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                T
              </div>
              <span className="font-extrabold text-lg tracking-tight">Tapyy Admin</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Super Admin Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Management
          </div>
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : item.badgeColor}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Session Badge & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          {/* Admin Identity Card */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-amber-300 flex items-center justify-center text-xs font-bold font-mono">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Super Admin</p>
                <p className="text-[10px] text-slate-400 font-mono">Session Active</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse" />
          </div>

          {/* Links & Logout */}
          <div className="space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              <span>View Customer Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Exit</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
