'use client';

import React, { useEffect, useState } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { getCardByCode, recordEvent } from '@/lib/data-service';
import ReviewFlow from './ReviewFlow';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface Props {
  cardCode: string;
  initialResult?: { card: PhysicalCard; business: Business } | null;
}

export default function CardResolver({ cardCode, initialResult }: Props) {
  const [result, setResult] = useState<{ card: PhysicalCard; business: Business } | null>(initialResult || null);
  const [loading, setLoading] = useState<boolean>(!initialResult);

  useEffect(() => {
    if (!initialResult) {
      resolveCard();
    } else {
      // Background non-blocking analytics tap event
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
        <div className="w-full max-w-[420px] bg-white rounded-[28px] p-8 text-center shadow-xl border border-gray-200/80 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-md">
            T
          </div>
          <div className="spin-loader my-2" />
          <p className="text-xs font-bold text-gray-700 tracking-wide">Connecting to Tapyy...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 sm:p-6 flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-[420px] bg-white rounded-[28px] p-8 text-center shadow-xl border border-gray-200/80">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200/60 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 font-heading">Card Not Found</h1>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Card code <code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-900">{cardCode}</code> could not be matched to an active business.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            Return to Tapyy Homepage
          </a>
        </div>
      </div>
    );
  }

  return <ReviewFlow card={result.card} business={result.business} />;
}

