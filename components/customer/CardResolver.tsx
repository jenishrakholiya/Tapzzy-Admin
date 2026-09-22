'use client';

import React, { useEffect, useState } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { getCardByCode, recordEvent } from '@/lib/data-service';
import ReviewFlow from './ReviewFlow';
import { AlertTriangle, Power, ArrowLeft, Eye } from 'lucide-react';
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
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-200/80 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-xs">
            T
          </div>
          <div className="spin-loader my-1" />
          <p className="text-xs font-bold text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-7 text-center shadow-xl border border-gray-200/80 space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 font-heading">Stand Not Found</h1>
            <p className="text-xs text-gray-500">
              Code <code className="font-mono font-bold text-gray-800">{cardCode}</code> was not found.
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 bg-slate-950 hover:bg-black text-white rounded-xl font-bold text-xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result.card.status === 'inactive' && !bypassInactive) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-7 text-center shadow-xl border border-gray-200/80 space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Power className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 font-heading">Stand Inactive</h1>
            <p className="text-xs text-gray-500">
              This stand for <strong>{result.business.name}</strong> is currently paused.
            </p>
          </div>

          <div className="pt-3 space-y-2">
            <button
              onClick={() => setBypassInactive(true)}
              className="w-full py-3 bg-slate-950 hover:bg-black text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Test Anyway
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ReviewFlow card={result.card} business={result.business} />;
}
