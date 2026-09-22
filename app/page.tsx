import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Zap,
  Wifi,
  QrCode,
  Star,
  Smartphone,
  ChevronRight,
  Store,
} from 'lucide-react';
import { getAllCards, getAllBusinesses } from '@/lib/data-service';

export default async function LandingPage() {
  const [cards, businesses] = await Promise.all([
    getAllCards(),
    getAllBusinesses(),
  ]);

  const activeCard = cards.find((c) => c.status === 'active') || cards[0];
  const activeCardCode = activeCard?.card_code || 'TAP-3JKKQ2R7';
  const activeBizName = activeCard?.business?.name || 'Artisan Espresso Lounge';

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-900 flex flex-col justify-between font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-lg shadow-sm">
            T
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-900 font-heading">
            tapyy
          </span>
          <span className="hidden sm:inline-flex text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            NFC 215 + AI
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/r/${activeCardCode}`}
            className="px-3.5 py-2 bg-white hover:bg-gray-100 text-slate-900 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Wifi className="w-3.5 h-3.5 text-amber-500 rotate-90" /> Test Tap
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Admin
          </Link>
        </div>
      </header>

      {/* Hero Main Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 text-center space-y-6 sm:space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/90 shadow-xs text-xs font-bold text-gray-800">
          <Sparkles className="w-4 h-4 text-amber-500" /> AI-Powered NFC & QR Physical Review Experience
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.08] max-w-3xl mx-auto font-heading">
          Turn physical venue taps into authentic 5-star Google reviews.
        </h1>

        <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Tapyy pairs hardware NFC table stands with intelligent AI review drafting. Customers tap their phone, pick natural feedback highlights, and copy directly to Google in under 15 seconds.
        </p>

        {/* Primary Interactive Action Cards */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
          {/* Card 1: Customer Test Tap Journey */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-lg space-y-4 hover:border-slate-900 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Wifi className="w-5 h-5 rotate-90" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                  {activeCardCode}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                  Customer Experience
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-0.5 font-heading">
                  Physical NFC Tap Flow
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Experience the live mobile review journey simulating a phone tap at{' '}
                  <strong className="text-gray-800">{activeBizName}</strong> ({activeCard?.name || 'Stand #1'}).
                </p>
              </div>
            </div>

            <Link
              href={`/r/${activeCardCode}`}
              className="mt-4 inline-flex items-center gap-2 w-full justify-center py-3.5 bg-slate-950 text-amber-300 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-md group-hover:scale-[1.01] active:scale-[0.98]"
            >
              <span>Launch Live Test Tap Flow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Super Admin Management */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-lg space-y-4 hover:border-slate-900 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                  Protected
                </span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  Fleet Control
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-0.5 font-heading">
                  Super Admin Portal
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Onboard client businesses, configure target Google URLs, issue hardware cards, and print table stand artwork.
                </p>
              </div>
            </div>

            <Link
              href="/admin"
              className="mt-4 inline-flex items-center gap-2 w-full justify-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md group-hover:scale-[1.01] active:scale-[0.98]"
            >
              <span>Enter Admin Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3-Step Journey Showcase */}
        <div className="pt-8 max-w-4xl mx-auto text-left">
          <div className="text-center mb-6">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
              How Tapyy Works in 3 Frictionless Steps
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="text-sm font-extrabold text-gray-900">1. Instant NFC Tap</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Guest taps any iPhone or Android against the acrylic stand. Zero app download required.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="text-sm font-extrabold text-gray-900">2. AI Polish & Drafts</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Customer selects 1-tap highlights. Server AI crafts natural, genuine review phrasing.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="text-sm font-extrabold text-gray-900">3. 1-Click Google Paste</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Text auto-copies to clipboard as Google Reviews opens directly on the user&apos;s phone.
              </p>
            </div>
          </div>
        </div>

        {/* Available Cards Deployed Picker (If multiple cards exist) */}
        {cards.length > 1 && (
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  Quick Switch Hardware Stand
                </span>
                <span className="text-[10px] text-gray-400 font-medium">{cards.length} deployed units</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/r/${c.card_code}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800 transition-all"
                  >
                    <span className="font-mono font-bold text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded">
                      {c.card_code}
                    </span>
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feature Checkmarks */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500 font-semibold">
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
      <footer className="p-4 sm:p-6 text-center text-xs text-gray-400 border-t border-gray-200/70 bg-white">
        © 2026 Tapyy Platform · Production NFC & QR Physical Review Infrastructure
      </footer>
    </div>
  );
}
