'use client';

import React, { useState, useEffect } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { createReviewSession, recordEvent } from '@/lib/data-service';
import {
  ArrowLeft,
  Check,
  Sparkles,
  ExternalLink,
  Copy,
  Star,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface Props {
  card: PhysicalCard;
  business: Business;
}

type Step = 'welcome' | 'feedback' | 'generating' | 'suggestions' | 'google' | 'success';

const QUICK_TAGS_BY_RATING: Record<number, string[]> = {
  5: ['Friendly staff', 'Fast service', 'Great atmosphere', 'Top quality', 'Clean venue', 'Will return!'],
  4: ['Good service', 'Friendly staff', 'Pleasant visit', 'Helpful team', 'Nice vibe'],
  3: ['Decent visit', 'Average speed', 'Okay experience', 'Room for improvement'],
  2: ['Slow service', 'Disappointing', 'Needs improvement'],
  1: ['Poor experience', 'Long wait', 'Needs attention'],
};

const RATING_LABELS: Record<number, string> = {
  5: 'Outstanding Experience!',
  4: 'Great Visit!',
  3: 'Standard / Okay',
  2: 'Room for Improvement',
  1: 'Disappointing Visit',
};

export default function ReviewFlow({ card, business }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  const triggerHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Fallback
      }
    }
  };

  const handleRate = (stars: number) => {
    triggerHaptic(15);
    setRating(stars);
  };

  const toggleTag = (tag: string) => {
    triggerHaptic(10);
    const exists = selectedTags.includes(tag);
    const updated = exists ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setSelectedTags(updated);

    if (!exists) {
      const separator = feedbackText.trim().length > 0 ? ', ' : '';
      setFeedbackText((prev) => prev.trim() + separator + tag);
    }
  };

  const handleGenerateAI = async (writeOwn = false) => {
    triggerHaptic(15);

    if (writeOwn) {
      const fallback = feedbackText.trim() || `I had a great experience at ${business.name}.`;
      setSelectedReview(fallback);
      setStep('google');
      return;
    }

    setStep('generating');

    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name,
          rating: rating || 5,
          feedback: feedbackText,
        }),
      });

      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setSelectedReview(data.suggestions[0]);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const fallbackList = [
        `Outstanding ${rating}-star experience at ${business.name}! ${feedbackText.trim() || 'Service was prompt and friendly.'} Highly recommended!`,
        `Really enjoyed my visit to ${business.name}. Everything was handled smoothly and professionally. Great atmosphere!`,
        `Top quality and welcoming service at ${business.name}. Definitely glad I stopped by and will certainly return.`
      ];
      setSuggestions(fallbackList);
      setSelectedReview(fallbackList[0]);
    } finally {
      setTimeout(() => {
        setStep('suggestions');
      }, 1200);
    }
  };

  const handleRegenerate = async () => {
    triggerHaptic(10);
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name,
          rating: rating || 5,
          feedback: feedbackText + ' (fresh variation)',
        }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setSelectedReview(data.suggestions[0]);
      }
    } catch {
      // Fallback
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyReview = async () => {
    triggerHaptic(20);
    if (!selectedReview) return;
    try {
      await navigator.clipboard.writeText(selectedReview);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenGoogle = () => {
    triggerHaptic(25);
    handleCopyReview();

    createReviewSession({
      business_id: business.id,
      card_id: card.id,
      rating,
      feedback: feedbackText,
      review_text: selectedReview,
      google_clicked: true,
      completed: true,
    }).catch(() => {});

    recordEvent('google_redirect', business.id, card.id, undefined, {
      rating,
      card_code: card.card_code,
    }).catch(() => {});

    window.open(business.google_review_url, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setStep('success');
    }, 800);
  };

  const currentTags = QUICK_TAGS_BY_RATING[rating] || QUICK_TAGS_BY_RATING[5];

  return (
    <div className="min-h-screen bg-[#f3f3f0] sm:p-4 md:p-6 flex items-center justify-center font-sans antialiased text-gray-900">
      <div className="w-full sm:max-w-[420px] bg-white sm:rounded-[36px] shadow-2xl sm:border sm:border-gray-200/90 overflow-hidden relative flex flex-col min-h-screen sm:min-h-[680px] transition-all">
        {/* Top Minimal Header */}
        <header className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs">
              T
            </div>
            <span className="font-extrabold tracking-tight text-sm text-gray-900 font-heading">
              tapyy
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold max-w-[200px] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="truncate">{business.name}</span>
          </div>
        </header>

        {/* Dynamic Step Content */}
        <main className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
          {/* STEP 1: WELCOME & STAR RATING */}
          {step === 'welcome' && (
            <div className="flex-1 flex flex-col justify-between text-center animate-fade-in py-2">
              <div className="my-auto space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-bold">
                  <span>{business.name}</span>
                  {card.name && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300 font-normal">{card.name}</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl font-black text-gray-900 tracking-tight font-heading">
                  How was your visit?
                </h1>

                {/* Stars */}
                <div className="py-3">
                  <div className="flex items-center justify-center gap-2 my-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRate(star)}
                          className={`p-1 rounded-2xl transition-all active:scale-90 focus:outline-none cursor-pointer ${
                            isSelected
                              ? 'text-amber-400 scale-110 drop-shadow-md'
                              : 'text-gray-200 hover:text-gray-300'
                          }`}
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-10 h-10 sm:w-11 sm:h-11 ${
                              isSelected ? 'fill-amber-400 stroke-amber-500' : 'fill-gray-100 stroke-gray-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {RATING_LABELS[rating] || 'Great!'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setStep('feedback');
                  }}
                  className="w-full py-4 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FEEDBACK & HIGHLIGHT TAGS */}
          {step === 'feedback' && (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setStep('welcome');
                  }}
                  className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change Rating ({rating}★)
                </button>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 font-heading">
                    What stood out?
                  </h1>
                </div>

                {/* Quick Highlight Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {currentTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border cursor-pointer ${
                          active
                            ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>

                {/* Clean Notes Text Area */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Note</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. Friendly staff, quick espresso, great atmosphere..."
                    className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-black focus:bg-white resize-none font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={() => handleGenerateAI(false)}
                  className="w-full py-3.5 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generate Polished Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAI(true)}
                  className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Use My Note Directly
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HIGH-SPEED GENERATION ANIMATION */}
          {step === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-fade-in">
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xl relative z-10">
                  <Sparkles className="w-8 h-8 animate-pulse text-amber-300" />
                </div>
                <div className="absolute inset-0 bg-amber-400/20 rounded-2xl blur-xl animate-ping" />
              </div>

              <h2 className="text-xl font-black text-gray-900 mb-2 font-heading">
                Polishing your review...
              </h2>

              <div className="w-full space-y-2.5 max-w-[280px] mt-4">
                <div className="h-14 rounded-2xl shimmer-box" />
                <div className="h-14 rounded-2xl shimmer-box opacity-60" />
              </div>
            </div>
          )}

          {/* STEP 4: SUGGESTIONS SELECTION */}
          {step === 'suggestions' && (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setStep('feedback');
                    }}
                    className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </button>

                  <button
                    type="button"
                    disabled={isRegenerating}
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black bg-gray-100 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <h1 className="text-xl font-black tracking-tight text-gray-900 mb-3 font-heading">
                  Pick a draft
                </h1>

                {/* Option Cards */}
                <div className="space-y-2.5 mb-3 max-h-[260px] overflow-y-auto pr-1">
                  {suggestions.map((item, idx) => {
                    const isPicked = selectedReview === item;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          triggerHaptic(10);
                          setSelectedReview(item);
                        }}
                        className={`p-3 rounded-2xl border text-xs leading-relaxed cursor-pointer transition-all active:scale-[0.99] ${
                          isPicked
                            ? 'border-slate-900 bg-white ring-2 ring-slate-950/10 shadow-xs font-medium text-gray-900'
                            : 'border-gray-200 bg-gray-50/70 hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
                              isPicked ? 'bg-slate-950 border-slate-950 text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isPicked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <p className="flex-1">{item}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Edit Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Edit if desired</label>
                  <textarea
                    value={selectedReview}
                    onChange={(e) => setSelectedReview(e.target.value)}
                    className="w-full h-18 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-black resize-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    handleCopyReview();
                    setStep('google');
                  }}
                  className="w-full py-3.5 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Google</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: FINISH ON GOOGLE */}
          {step === 'google' && (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setStep('suggestions');
                  }}
                  className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Review
                </button>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 font-heading">
                    Publish on Google
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Review text is copied. Tap below to open Google and paste.
                  </p>
                </div>

                {/* Copied Review Card */}
                <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Text copied to clipboard
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReview}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Re-copy
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 italic max-h-24 overflow-y-auto">
                    &ldquo;{selectedReview}&rdquo;
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleOpenGoogle}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <span>Open Google Reviews</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: THANK YOU */}
          {step === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-2 font-heading">
                Thank you!
              </h1>

              <p className="text-xs text-gray-600 max-w-[260px] leading-relaxed mb-6">
                Your review helps support <strong className="text-gray-900">{business.name}</strong>.
              </p>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setStep('welcome');
                  setRating(5);
                  setFeedbackText('');
                  setSelectedTags([]);
                  setSelectedReview('');
                }}
                className="w-full py-3.5 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                Done / Test Again
              </button>
            </div>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="p-3 text-center bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
          Powered by <strong className="text-gray-700">Tapyy</strong>
        </footer>

        {/* Toast */}
        {copiedToast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-fade-in border border-slate-700 z-50">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Copied!</span>
          </div>
        )}
      </div>
    </div>
  );
}
