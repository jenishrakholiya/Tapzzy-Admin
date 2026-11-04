'use client';

import React, { useEffect, useState } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { getCardByCode, recordEvent } from '@/lib/data-service';
import ReviewFlow from './ReviewFlow';
import StandActivation from './StandActivation';
import { AlertTriangle, Power, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  cardCode: string;
  initialResult?: { card: PhysicalCard; business: Business | null } | null;
}

export default function CardResolver({ cardCode, initialResult }: Props) {
  const [result, setResult] = useState<{ card: PhysicalCard; business: Business | null } | null>(initialResult || null);
  const [loading, setLoading] = useState<boolean>(!initialResult);

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
      if (initialResult.business) {
        recordEvent('nfc_tap', initialResult.business.id, initialResult.card.id, undefined, { card_code: cardCode });
      }
    }
  }, [initialResult, cardCode]);

  useEffect(() => {
    // If we have no initial result OR if it arrived as unassigned, always verify live database
    // in case it was linked/assigned from the admin panel
    if (!initialResult || initialResult.card.status === 'unassigned' || !initialResult.business) {
      resolveCard();
    }
  }, [cardCode]);

  async function resolveCard() {
    setLoading(true);
    try {
      const res = await getCardByCode(cardCode);
      if (res) {
        setResult(res);
        if (res.business) {
          recordEvent('nfc_tap', res.business.id, res.card.id, undefined, { card_code: cardCode });
        }
      }
    } catch (err) {
      console.error('Error resolving card:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in font-sans">
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
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in font-sans">
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

  // If card is unassigned or has no linked business yet, show Stand Activation Page!
  if (result.card.status === 'unassigned' || !result.business) {
    return (
      <StandActivation
        card={result.card}
        onActivated={(activatedCard, activatedBiz) => {
          setResult({ card: activatedCard, business: activatedBiz });
        }}
      />
    );
  }

  if (result.card.status === 'inactive') {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in font-sans">
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-7 text-center shadow-xl border border-gray-200/80 space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Power className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider">
              Stand Inactive
            </span>
            <h1 className="text-xl font-black text-gray-900 font-heading">Stand Paused</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              This stand for <strong>{result.business.name}</strong> is currently paused and not accepting reviews at this time.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 bg-slate-950 hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ReviewFlow card={result.card} business={result.business} />;
}
