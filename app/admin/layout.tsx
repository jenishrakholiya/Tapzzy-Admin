import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Building2, CreditCard, BarChart3, ExternalLink } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span className="font-extrabold text-xl tracking-tight">Tapyy Admin</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Super Admin Portal</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" /> Overview
          </Link>
          <Link
            href="/admin/businesses"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Building2 className="w-4 h-4 text-blue-400" /> Businesses
          </Link>
          <Link
            href="/admin/cards"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" /> Card Issuance
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 rounded-lg"
          >
            <span>Tapyy Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
