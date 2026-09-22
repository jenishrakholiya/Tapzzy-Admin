import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Wifi,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { getAllCards } from '@/lib/data-service';

export default async function LandingPage() {
  const cards = await getAllCards();
  const activeCard = cards.find((c) => c.status === 'active') || cards[0];
  const activeCardCode = activeCard?.card_code || 'TAP-3JKKQ2R7';
  const activeBizName = activeCard?.business?.name || 'Artisan Espresso Lounge';

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-gray-900 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <header className="px-6 py-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm">
              T
            </div>
            <span className="font-extrabold tracking-tight text-base font-heading">
              tapyy
            </span>
          </div>

          <Link
            href="/admin"
            className="px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Admin
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-20 text-center space-y-6 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-xs text-xs font-semibold text-gray-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Contactless NFC & QR Review Stands
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight font-heading">
          Turn customer visits into genuine 5-star Google reviews.
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          Tapyy pairs contactless venue stands with guided review drafting. Guests tap their phone, select quick highlights, and post directly to Google in seconds.
        </p>

        {/* Action Grid */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          {/* Card 1: Test Customer Flow */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm space-y-4 hover:border-black transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wifi className="w-4 h-4 rotate-90" />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-heading">Customer Tap Flow</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Test the live mobile review journey for stand at <strong className="text-gray-800">{activeBizName}</strong>.
              </p>
            </div>

            <Link
              href={`/r/${activeCardCode}`}
              className="inline-flex items-center gap-2 w-full justify-center py-3 bg-slate-950 text-amber-300 rounded-xl text-xs font-bold hover:bg-black transition-all"
            >
              <span>Launch Test Flow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Admin Portal */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm space-y-4 hover:border-black transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-heading">Admin Portal</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manage client businesses, deploy physical stands, and monitor review activity.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 w-full justify-center py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>Open Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Step Minimal Journey */}
        <div className="pt-8 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Step 1</span>
            <h4 className="text-xs font-extrabold text-gray-900">Tap or Scan</h4>
            <p className="text-[11px] text-gray-500">Customer taps the stand with their phone.</p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Step 2</span>
            <h4 className="text-xs font-extrabold text-gray-900">AI Polish</h4>
            <p className="text-[11px] text-gray-500">Picks quick highlights into polished text.</p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Step 3</span>
            <h4 className="text-xs font-extrabold text-gray-900">Post on Google</h4>
            <p className="text-[11px] text-gray-500">Copies to clipboard & opens Google Reviews.</p>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="p-5 text-center text-xs text-gray-400 border-t border-gray-200/60 bg-white">
        © 2026 Tapyy. All rights reserved.
      </footer>
    </div>
  );
}
