'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  CreditCard,
  BarChart3,
  MessageSquare,
  ExternalLink,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      label: 'Stands & Cards',
      href: '/admin/cards',
      icon: CreditCard,
      badgeColor: 'text-emerald-400',
    },
    {
      label: 'Reviews',
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
    const current = pathname.replace(/\/$/, '') || '/';
    const target = item.href.replace(/\/$/, '') || '/';
    if (item.exact) {
      return current === target;
    }
    return current === target || current.startsWith(target + '/');
  };

  return (
    <>
      {/* Mobile & Tablet Header + Always-Open Visible Navbar */}
      <header className="md:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        {/* Brand Bar */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
              T
            </div>
            <span className="font-extrabold text-sm tracking-tight font-heading">Tapyy Admin</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1"
            >
              <span>Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-1.5 rounded-lg bg-slate-800/80 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visible Horizontal Navigation Bar (Always Open & Shown at Start) */}
        <nav className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto text-xs bg-slate-950/40">
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all shrink-0 ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : item.badgeColor}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Desktop Sidebar (Always Open & Sticky on Left >= md) */}
      <aside className="hidden md:flex sticky top-0 left-0 h-screen w-60 bg-slate-900 text-white flex-col border-r border-slate-800 shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
              T
            </div>
            <span className="font-extrabold text-base tracking-tight font-heading">
              Tapyy Admin
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : item.badgeColor}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1 bg-slate-950/40">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <span>Customer Site</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
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
          </button>
        </div>
      </aside>
    </>
  );
}
