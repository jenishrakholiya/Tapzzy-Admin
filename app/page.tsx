import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ExternalLink, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { getAllCards } from '@/lib/data-service';

export default async function LandingPage() {
  const cards = await getAllCards();
  const activeCardCode = cards[0]?.card_code || 'TAP-3JKKQ2R7';

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-gray-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-lg shadow-md">
            T
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-900">tapyy</span>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase">
            Production SaaS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Admin Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-xs text-xs font-bold text-gray-700">
          <Sparkles className="w-4 h-4 text-amber-500" /> AI-Powered NFC & QR Review Experience
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.08] max-w-3xl mx-auto">
          Turn physical customer taps into authentic Google reviews.
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Tapyy pairs hardware NFC cards and QR stands with server-side AI generation. Customers share genuine feedback, pick polished review suggestions, and copy directly to Google.
        </p>

        {/* Action Grid: Customer Tap Flow & Super Admin */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          {/* Card 1: Customer Tap Flow */}
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-lg space-y-4 hover:border-black transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Customer Flow</span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">Physical NFC Tap</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Experience the live mobile review journey for card <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono font-bold text-gray-800">{activeCardCode}</code>.
              </p>
            </div>
            <Link
              href={`/r/${activeCardCode}`}
              className="inline-flex items-center gap-2 w-full justify-center py-3.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
            >
              Test Tap Flow <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Super Admin */}
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-lg space-y-4 hover:border-black transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Super Admin</span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">Admin Management</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Onboard businesses, manage target Google Review URLs, and issue physical NFC/QR cards.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 w-full justify-center py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
            >
              Open Admin Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Next.js App Router & TypeScript
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supabase RLS Multi-Tenant Security
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Server-side AI Key Security
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-gray-400 border-t border-gray-200/60 bg-white">
        © 2026 Tapyy Platform · Production Next.js + Supabase Architecture
      </footer>
    </div>
  );
}
