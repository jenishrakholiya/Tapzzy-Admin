'use client';

import React, { useState } from 'react';
import { Business, PhysicalCard } from '@/lib/types';
import { createReviewSession, recordEvent } from '@/lib/data-service';
import { ArrowLeft, Check, Sparkles, ExternalLink, Copy, Star, RefreshCw, ChevronRight } from 'lucide-react';

interface Props {
  card: PhysicalCard;
  business: Business;
}

type Step = 'welcome' | 'feedback' | 'generating' | 'suggestions' | 'google' | 'success';

const QUICK_TAGS_BY_RATING: Record<number, string[]> = {
  5: ['Friendly staff', 'Prompt service', 'Great atmosphere', 'High quality', 'Clean & welcoming', 'Will return!'],
  4: ['Good service', 'Friendly staff', 'Pleasant visit', 'Helpful team', 'Nice vibe'],
  3: ['Decent visit', 'Average speed', 'Okay experience', 'Room for improvement'],
  2: ['Slow service', 'Disappointing', 'Needs improvement'],
  1: ['Poor experience', 'Long wait', 'Needs attention'],
};

const RATING_LABELS: Record<number, string> = {
  5: 'Outstanding — 5 Stars!',
  4: 'Great experience — 4 Stars',
  3: 'It was okay — 3 Stars',
  2: 'Needs improvement — 2 Stars',
  1: 'Disappointing — 1 Star',
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

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore fallback
      }
    }
  };

  const handleRate = (stars: number) => {
    triggerHaptic(15);
    setRating(stars);
  };

  const toggleTag = (tag: string) => {
    triggerHaptic(8);
    const exists = selectedTags.includes(tag);
    const updated = exists ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setSelectedTags(updated);

    // Update feedback text intelligently
    if (!exists) {
      const separator = feedbackText.trim().length > 0 ? ', ' : '';
      setFeedbackText((prev) => prev.trim() + separator + tag);
    }
  };

  const handleGenerateAI = async (writeOwn = false) => {
    triggerHaptic(12);

    if (writeOwn) {
      const fallback = feedbackText.trim() || `I had a ${rating}-star experience at ${business.name}.`;
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
        throw new Error('Fallback required');
      }
    } catch {
      const fallbackList = [
        `Outstanding ${rating}-star experience at ${business.name}! ${feedbackText.trim() || 'Service was prompt, courteous, and top-tier.'} Highly recommended!`,
        `Really enjoyed my visit to ${business.name}. Everything was handled smoothly and professionally. Great overall atmosphere!`,
        `Top quality and welcoming service at ${business.name}. Definitely glad I stopped by and will certainly return.`
      ];
      setSuggestions(fallbackList);
      setSelectedReview(fallbackList[0]);
    } finally {
      setStep('suggestions');
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
          feedback: feedbackText + ' (alternative phrasing)',
        }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setSelectedReview(data.suggestions[0]);
      }
    } catch {
      // Keep existing
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
      setTimeout(() => setCopiedToast(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleOpenGoogle = () => {
    triggerHaptic(25);
    handleCopyReview();

    // Background asynchronous database tracking (non-blocking)
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

    // Open target Google review link
    window.open(business.google_review_url, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setStep('success');
    }, 900);
  };

  const currentTags = QUICK_TAGS_BY_RATING[rating] || QUICK_TAGS_BY_RATING[5];

  return (
    <div className="min-h-screen bg-[#f1f1ee] p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-2xl border border-gray-200/80 overflow-hidden relative flex flex-col min-h-[660px]">
        {/* Top Header */}
        <header className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
              T
            </div>
            <span className="font-extrabold tracking-tight text-base text-gray-900">tapyy</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200/80 text-gray-700 text-xs font-semibold max-w-[200px] truncate shadow-xs">
            <span className="truncate">{business.name}</span>
          </div>
        </header>

        {/* Dynamic Step Content */}
        <main className="p-6 flex-1 flex flex-col justify-between">
          {/* STEP 1: WELCOME & STAR RATING */}
          {step === 'welcome' && (
            <div className="flex-1 flex flex-col justify-between text-center animate-fade-in">
              <div className="my-auto py-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-amber-400 text-xs font-bold mb-4 shadow-sm">
                  <span>{business.name}</span>
                  {card.name && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-200 font-medium">{card.name}</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight mb-2 font-heading">
                  How was your visit?
                </h1>

                <p className="text-xs text-gray-500 leading-relaxed max-w-[290px] mx-auto mb-6">
                  Tap to rate your experience. We will turn your feedback into a polished review in seconds.
                </p>

                {/* Interactive Star Row */}
                <div className="flex items-center justify-center gap-2.5 my-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(star)}
                        className={`star-interactive p-1.5 focus:outline-none transition-all ${
                          isSelected ? 'active text-amber-400 scale-110' : 'text-gray-200 hover:text-gray-300'
                        }`}
                        aria-label={`Rate ${star} star`}
                      >
                        <Star className={`w-9 h-9 ${isSelected ? 'fill-amber-400 drop-shadow-sm' : 'fill-gray-100'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] font-bold mt-2 animate-fade-in">
                  {RATING_LABELS[rating]}
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setStep('feedback');
                  }}
                  className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <p className="text-[11px] text-gray-400 font-mono text-center">
                  Instant NFC & QR Review · Card {card.card_code}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: FEEDBACK & QUICK PILLS */}
          {step === 'feedback' && (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setStep('welcome');
                  }}
                  className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-black mb-3 transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change Rating ({rating}★)
                </button>

                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1 font-heading">
                  What stood out?
                </h1>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Tap highlights or jot down a quick thought. Our AI will handle the rest.
                </p>

                {/* 1-Tap Quick Tag Pills */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Quick Highlights
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
                            active
                              ? 'bg-black text-white border-black shadow-xs'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {active ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Area */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                    <span>Your Notes</span>
                    <span className="text-gray-400 font-normal text-[11px]">Optional</span>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. Delicious espresso, fast check-in, super friendly staff..."
                    className="w-full h-28 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-black focus:bg-white resize-none shadow-xs transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => handleGenerateAI(false)}
                  className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Polished Reviews</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAI(true)}
                  className="w-full py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  Skip & Use My Own Words
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HIGH-SPEED GENERATION SHIMMER */}
          {step === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-black text-amber-300 flex items-center justify-center mb-6 shadow-xl relative">
                <Sparkles className="w-8 h-8 animate-pulse text-amber-300" />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5 font-heading">
                Polishing your review...
              </h2>
              <p className="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-8">
                Synthesizing natural, authentic review suggestions tailored for <strong className="text-gray-900">{business.name}</strong>.
              </p>

              {/* Shimmer Preview Skeleton */}
              <div className="w-full space-y-3 max-w-[340px]">
                <div className="h-16 rounded-2xl shimmer-box" />
                <div className="h-16 rounded-2xl shimmer-box opacity-75" />
                <div className="h-16 rounded-2xl shimmer-box opacity-50" />
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
                    className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-black transition-colors active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </button>

                  <button
                    type="button"
                    disabled={isRegenerating}
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Review Suggestions
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1 font-heading">
                  Pick your favorite draft
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                  Tap to select, then click to post on Google:
                </p>

                {/* Suggestion Option Cards */}
                <div className="space-y-2.5 mb-4 max-h-[260px] overflow-y-auto pr-1">
                  {suggestions.map((item, idx) => {
                    const isPicked = selectedReview === item;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          triggerHaptic(10);
                          setSelectedReview(item);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed cursor-pointer transition-all active:scale-[0.99] relative ${
                          isPicked
                            ? 'border-black bg-white ring-2 ring-black/5 shadow-md font-medium text-gray-900'
                            : 'border-gray-200 bg-gray-50/70 hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
                              isPicked ? 'bg-black border-black text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isPicked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="flex-1">{item}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Custom Editor */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Edit wording (optional)</span>
                    <span className="text-[11px] text-gray-400 font-normal">Editable</span>
                  </div>
                  <textarea
                    value={selectedReview}
                    onChange={(e) => setSelectedReview(e.target.value)}
                    className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-black focus:bg-white resize-none shadow-xs transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    handleCopyReview();
                    setStep('google');
                  }}
                  className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Ready to Post on Google</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: FINISH ON GOOGLE */}
          {step === 'google' && (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setStep('suggestions');
                  }}
                  className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-black mb-3 transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Review
                </button>

                <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 mb-1">
                  Step 2 of 2
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1 font-heading">
                  Paste on Google Reviews
                </h1>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Your review text is automatically copied to your clipboard. Simply open Google and paste!
                </p>

                {/* Copied Review Card */}
                <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-lg mb-4 relative border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to clipboard
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReview}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline active:scale-95 transition-all"
                    >
                      <Copy className="w-3 h-3" /> Re-copy
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 max-h-24 overflow-y-auto pr-1 italic">
                    "{selectedReview}"
                  </p>
                </div>

                {/* Two-step Visual Instructions */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </span>
                    <span className="text-gray-700">Click <strong>Open Google Reviews</strong> below</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </span>
                    <span className="text-gray-700">Paste your review & submit on Google!</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-6">
                <button
                  type="button"
                  onClick={handleOpenGoogle}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
                >
                  <span>Open Google Review Page</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: THANK YOU SUCCESS */}
          {step === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mb-5 shadow-sm">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 font-heading">
                Thank you!
              </h1>
              <p className="text-xs text-gray-600 max-w-[280px] leading-relaxed mb-8">
                Your review helps <strong className="text-gray-900">{business.name}</strong> thrive and helps others find great local businesses.
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
                className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
              >
                Submit Another Review
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="p-3 text-center bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
          Powered by <strong className="text-gray-700">Tapyy</strong> · Hardware NFC & QR Engine
        </footer>

        {/* Floating Toast */}
        {copiedToast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-700 z-50">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copied to clipboard!</span>
          </div>
        )}
      </div>
    </div>
  );
}

