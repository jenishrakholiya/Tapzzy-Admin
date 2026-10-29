'use client';

import React, { useState, useEffect } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { getAllBusinesses, activateCard } from '@/lib/data-service';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Store,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  card: PhysicalCard;
  onActivated: (card: PhysicalCard, business: Business) => void;
}

const QUICK_PLACEMENTS = [
  'Counter Stand #1',
  'Table Stand #4',
  'Bar Station',
  'Reception Desk',
  'VIP Table #1',
  'Patio Stand',
];

export default function StandActivation({ card, onActivated }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  // Mode: 'existing' | 'new'
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Form Fields
  const [selectedBizId, setSelectedBizId] = useState('');
  const [newBizName, setNewBizName] = useState('');
  const [newGoogleReviewUrl, setNewGoogleReviewUrl] = useState('');
  const [placementName, setPlacementName] = useState(
    card.name && !card.name.startsWith('Blank Stand') ? card.name : 'Counter Stand #1'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState<{
    card: PhysicalCard;
    business: Business;
  } | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoadingBiz(true);
    try {
      const list = await getAllBusinesses();
      setBusinesses(list);
      if (list.length > 0) {
        setSelectedBizId(list[0].id);
      }
      setMode('existing');
    } catch (err) {
      console.error('Failed to load businesses:', err);
      setMode('existing');
    } finally {
      setLoadingBiz(false);
    }
  }

  const selectedBusiness = businesses.find((b) => b.id === selectedBizId);

  // Auto-fill Google URL suggestion when typing new business name
  function handleBizNameChange(name: string) {
    setNewBizName(name);
    if (!newGoogleReviewUrl || newGoogleReviewUrl.includes('google.com/search?q=')) {
      if (name.trim()) {
        setNewGoogleReviewUrl(
          `https://www.google.com/search?q=${encodeURIComponent(name.trim())}+Google+reviews`
        );
      } else {
        setNewGoogleReviewUrl('');
      }
    }
  }

  const [origin, setOrigin] = useState('https://tapyy.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const standUrl = `${origin}/r/${card.card_code}`;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'new') {
      setErrorMsg('Linking stands to new businesses from this screen is disabled. Please create the business in Admin first.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      let res: { card: PhysicalCard; business: Business };

      if (mode === 'existing') {
        if (!selectedBizId) {
          throw new Error('Please select an existing business.');
        }
        res = await activateCard(card.card_code, {
          business_id: selectedBizId,
          placement_name: placementName.trim() || 'Counter Stand #1',
        });
      } else {
        throw new Error('Direct stand activation for new businesses is disabled.');
      }

      setActivatedSuccess(res);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to activate stand.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Success Celebration View
  if (activatedSuccess) {
    return (
      <div className="min-h-screen bg-[#f1f1ee] p-4 flex items-center justify-center animate-fade-in font-sans">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-7 text-center shadow-xl border border-gray-200/90 space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-full uppercase tracking-wider">
              Stand Permanently Linked
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-heading">
              {activatedSuccess.business.name}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Stand <strong className="text-gray-800 font-mono">{card.card_code}</strong> is now configured for{' '}
              <strong className="text-gray-800">{activatedSuccess.card.name}</strong>.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-2xl p-4 flex items-center gap-3.5 text-left border border-slate-800">
            <div className="p-2 bg-white rounded-xl flex-shrink-0">
              <QRCodeSVG value={standUrl} size={64} level="M" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ready for Guests</p>
              <p className="text-xs font-extrabold truncate text-white">{activatedSuccess.card.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{standUrl}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onActivated(activatedSuccess.card, activatedSuccess.business)}
              className="w-full py-3.5 bg-slate-950 hover:bg-black text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span>Launch 5-Star Review Flow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-gray-400">
              Every future NFC tap or QR scan will launch this business review journey.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Setup / Activation Form
  return (
    <div className="min-h-screen bg-[#f1f1ee] p-4 sm:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/90 space-y-5">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Hardware Stand Setup</span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight font-heading">
            Link Stand to Business
          </h1>
          <p className="text-xs text-gray-500">
            Scan detected unassigned stand code{' '}
            <code className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
              {card.card_code}
            </code>
            . Link it below to activate permanently.
          </p>
        </div>

        {/* QR Preview Card */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 flex items-center justify-between border border-slate-800 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Stand Serial
            </span>
            <p className="text-sm font-black font-mono text-white">{card.card_code}</p>
            <p suppressHydrationWarning className="text-[10px] text-gray-400 truncate max-w-[200px]">
              {standUrl}
            </p>
          </div>
          <div className="p-2 bg-white rounded-xl shadow-xs">
            <QRCodeSVG value={standUrl} size={54} level="M" />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'existing'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Existing Client
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'new'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> New Business
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Business Client
              </label>
              {loadingBiz ? (
                <div className="p-3 bg-gray-50 border rounded-xl text-xs text-gray-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading businesses...
                </div>
              ) : businesses.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold">No businesses registered yet.</p>
                  <a
                    href="/admin/businesses"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-bold"
                  >
                    Click here to create business in Admin
                  </a>
                </div>
              ) : (
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-black cursor-pointer"
                >
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.name} ({biz.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Activation Disabled for New Business</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Stands cannot be linked directly to a new business from this screen. Please register the business in the{' '}
                  <a
                    href="/admin/businesses"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-amber-900 hover:text-black"
                  >
                    Admin Dashboard
                  </a>{' '}
                  first, then link this stand under &quot;Existing Client&quot;.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('existing')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ← Switch back to Existing Client
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="e.g. Bella Italia Cafe"
                  value={newBizName}
                  onChange={(e) => handleBizNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Google Review URL
                </label>
                <input
                  type="url"
                  disabled
                  placeholder="https://g.page/r/.../review"
                  value={newGoogleReviewUrl}
                  onChange={(e) => setNewGoogleReviewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Placement / Stand Label */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span>Placement / Stand Label</span>
              <span className="text-[10px] text-gray-400 font-normal">Where will this stand sit?</span>
            </label>
            <input
              type="text"
              required={mode === 'existing'}
              disabled={mode === 'new'}
              placeholder="e.g. Counter Stand #1"
              value={placementName}
              onChange={(e) => setPlacementName(e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none ${
                mode === 'new'
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
              }`}
            />

            {/* Quick Placement Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_PLACEMENTS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  disabled={mode === 'new'}
                  onClick={() => setPlacementName(loc)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    mode === 'new'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : placementName === loc
                      ? 'bg-slate-950 text-white cursor-pointer'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              mode === 'new' ||
              submitting ||
              (mode === 'existing' && (!selectedBizId || businesses.length === 0))
            }
            className={`w-full py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
              mode === 'new'
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                : submitting
                ? 'bg-emerald-600/70 text-white cursor-wait shadow-sm'
                : (mode === 'existing' && (!selectedBizId || businesses.length === 0))
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-[0.98] cursor-pointer'
            }`}
          >
            {mode === 'new' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span>Activate & Link Stand (Disabled for New Business)</span>
              </>
            ) : submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Activating & Linking...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Activate & Link Stand Permanently</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
