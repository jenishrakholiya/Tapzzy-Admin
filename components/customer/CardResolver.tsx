'use client';

import React, { useEffect, useState } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { getCardByCode, recordEvent } from '@/lib/data-service';
import ReviewFlow from './ReviewFlow';
import { AlertTriangle, Power, Sparkles, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

interface Props {
  cardCode: string;
  initialResult?: { card: PhysicalCard; business: Business } | null;
}

export default function CardResolver({ cardCode, initialResult }: Props) {
  const [result, setResult] = useState<{ card: PhysicalCard; business: Business } | null>(initialResult || null);
  const [loading, setLoading] = useState<boolean>(!initialResult);
  const [bypassInactive, setBypassInactive] = useState<boolean>(false);

  useEffect(() => {
    if (!initialResult) {
      resolveCard();
    } else {
      // Non-blocking analytics tap event
      recordEvent('nfc_tap', initialResult.business.id, initialResult.card.id, undefined, { card_code: cardCode });
    }
  }, [cardCode, initialResult]);

  async function resolveCard() {
    setLoading(true);
    try {
      const res = await getCardByCode(cardCode);
      if (res) {
        setResult(res);
        recordEvent('nfc_tap', res.business.id, res.card.id, undefined, { card_code: cardCode });
      }
    } catch (err) {
      console.error('Error resolving card:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 sm:p-6 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 text-center shadow-2xl border border-gray-200/90 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md">
            T
          </div>
          <div className="spin-loader my-2" />
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-gray-900 tracking-tight">Connecting to Tapyy Hardware...</p>
            <p className="text-xs text-gray-400 font-mono">Resolving {cardCode}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 sm:p-6 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 text-center shadow-2xl border border-gray-200/90 space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl border border-amber-200/80 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-heading">Hardware Stand Not Found</h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Stand code <code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-900">{cardCode}</code> could not be matched to an active venue or business.
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3.5 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Homepage
            </Link>
            <Link
              href="/admin/cards"
              className="inline-flex items-center justify-center w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs transition-all"
            >
              Open Admin Hardware Registry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If card is paused/inactive by manager and not bypassed by test
  if (result.card.status === 'inactive' && !bypassInactive) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 sm:p-6 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 text-center shadow-2xl border border-gray-200/90 space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl border border-amber-200/80 flex items-center justify-center mx-auto shadow-sm">
            <Power className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
              Stand Paused
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-heading mt-2">
              Stand Temporarily Inactive
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              This physical stand for <strong>{result.business.name}</strong> ({result.card.name}) has been temporarily paused by venue management.
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => setBypassInactive(true)}
              className="w-full py-3.5 bg-slate-950 hover:bg-black text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Eye className="w-4 h-4" /> Preview / Test Anyway
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ReviewFlow card={result.card} business={result.business} />;
}
