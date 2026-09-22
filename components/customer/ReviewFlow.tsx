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
  ThumbsUp,
  Heart,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  card: PhysicalCard;
  business: Business;
}

type Step = 'welcome' | 'feedback' | 'generating' | 'suggestions' | 'google' | 'success';

const QUICK_TAGS_BY_RATING: Record<number, string[]> = {
  5: ['Super Friendly Staff', 'Fast & Attentive', 'Cozy Atmosphere', 'Top Quality', 'Clean & Spotless', 'Will Return!'],
  4: ['Good Service', 'Friendly Staff', 'Pleasant Visit', 'Helpful Team', 'Nice Ambiance', 'Good Value'],
  3: ['Decent Experience', 'Average Wait Time', 'Standard Service', 'Room for Improvement'],
  2: ['Slow Service', 'Below Expectations', 'Needs Attention', 'Disappointing Visit'],
  1: ['Poor Experience', 'Long Wait Time', 'Unhelpful Staff', 'Needs Urgent Fixes'],
};

const RATING_LABELS: Record<number, { title: string; subtitle: string }> = {
  5: { title: 'Outstanding Experience!', subtitle: '5 stars — Exceeded all expectations' },
  4: { title: 'Great Visit!', subtitle: '4 stars — Very pleasant and enjoyable' },
  3: { title: 'Standard / Okay', subtitle: '3 stars — Met ordinary expectations' },
  2: { title: 'Room for Improvement', subtitle: '2 stars — Fell short of expectations' },
  1: { title: 'Disappointing Visit', subtitle: '1 star — Needs management attention' },
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
  const [generationPhase, setGenerationPhase] = useState<number>(0);

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

  // Cycling progress messages during AI generation
  useEffect(() => {
    if (step === 'generating') {
      setGenerationPhase(0);
      const t1 = setTimeout(() => setGenerationPhase(1), 600);
      const t2 = setTimeout(() => setGenerationPhase(2), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [step]);

  const handleGenerateAI = async (writeOwn = false) => {
    triggerHaptic(15);

    if (writeOwn) {
      const fallback = feedbackText.trim() || `I had a great ${rating}-star experience at ${business.name}.`;
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
        `Outstanding ${rating}-star experience at ${business.name}! ${feedbackText.trim() || 'Service was prompt, courteous, and top-tier.'} Highly recommended!`,
        `Really enjoyed my visit to ${business.name}. Everything was handled smoothly and professionally. Great overall atmosphere!`,
        `Top quality and welcoming service at ${business.name}. Definitely glad I stopped by and will certainly return.`
      ];
      setSuggestions(fallbackList);
      setSelectedReview(fallbackList[0]);
    } finally {
      setTimeout(() => {
        setStep('suggestions');
      }, 1500);
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
      // Keep existing suggestions
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

    // Database tracking
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
  const ratingInfo = RATING_LABELS[rating] || RATING_LABELS[5];

  return (
    <div className="min-h-screen bg-[#f3f3f0] sm:p-4 md:p-6 flex items-center justify-center font-sans antialiased text-gray-900">
      <div className="w-full sm:max-w-[440px] bg-white sm:rounded-[36px] shadow-2xl sm:border sm:border-gray-200/90 overflow-hidden relative flex flex-col min-h-screen sm:min-h-[720px] transition-all">
        {/* Top Header */}
        <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs">
              T
            </div>
            <span className="font-extrabold tracking-tight text-base text-gray-900 font-heading">
              tapyy
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-semibold max-w-[220px] truncate shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <span className="truncate">{business.name}</span>
          </div>
        </header>

        {/* Dynamic Step Content */}
        <main className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
          {/* STEP 1: WELCOME & STAR RATING */}
          {step === 'welcome' && (
            <div className="flex-1 flex flex-col justify-between text-center animate-fade-in py-2">
              <div className="my-auto space-y-4">
                {/* Clean Business Badge with Card Placement */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-amber-300 text-xs font-bold shadow-sm">
                  <span>{business.name}</span>
                  {card.name && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-200 font-medium">{card.name}</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight font-heading">
                  How was your visit?
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-[320px] mx-auto">
                  Tap your rating below. We will help polish your feedback into an authentic Google review in seconds.
                </p>

                {/* Interactive Golden Star Rating */}
                <div className="py-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRate(star)}
                          className={`p-1.5 rounded-2xl transition-all active:scale-90 focus:outline-none cursor-pointer ${
                            isSelected
                              ? 'text-amber-400 scale-110 drop-shadow-md'
                              : 'text-gray-200 hover:text-gray-300'
                          }`}
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            className={`w-10 h-10 sm:w-12 sm:h-12 ${
                              isSelected ? 'fill-amber-400 stroke-amber-500' : 'fill-gray-100 stroke-gray-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating Description Badge */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs animate-fade-in">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {ratingInfo.title}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">{ratingInfo.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Action Continue */}
              <div className="space-y-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setStep('feedback');
                  }}
                  className="w-full py-4 bg-slate-950 hover:bg-black text-white rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-slate-950/15 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Highlights</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <p className="text-[11px] text-gray-400 font-mono text-center">
                  Instant NFC Stand · {card.card_code}
                </p>
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
                  className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change Rating ({rating}★)
                </button>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 font-heading">
                    What stood out most?
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Pick quick highlights or type a brief note. Our AI transforms it into natural Google review options.
                  </p>
                </div>

                {/* 1-Tap Quick Tag Pills */}
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Quick Highlights ({rating}★)
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                </div>

                {/* Text Area */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                    <span>Your Experience Note</span>
                    <span className="text-gray-400 font-normal text-[11px]">Optional</span>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. Loved the friendly barista, cozy vibe, and delicious espresso..."
                    className="w-full h-28 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-black focus:bg-white resize-none shadow-xs transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => handleGenerateAI(false)}
                  className="w-full py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-black hover:opacity-95 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generate Polished Reviews with AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAI(true)}
                  className="w-full py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Skip AI & Use My Notes
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HIGH-SPEED GENERATION ANIMATION */}
          {step === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-2xl relative z-10">
                  <Sparkles className="w-10 h-10 animate-pulse text-amber-300" />
                </div>
                <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-xl animate-ping" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2 font-heading">
                Polishing your review...
              </h2>

              <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-full mb-6">
                {generationPhase === 0 && 'Understanding your rating & highlights...'}
                {generationPhase === 1 && 'Synthesizing natural, human phrasing...'}
                {generationPhase >= 2 && 'Formatting 3 Google-ready suggestions...'}
              </p>

              {/* Shimmer Preview Skeletons */}
              <div className="w-full space-y-3 max-w-[320px]">
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
                    className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </button>

                  <button
                    type="button"
                    disabled={isRegenerating}
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1 font-heading">
                  Pick your favorite draft
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                  Select the review option that best reflects your genuine experience:
                </p>

                {/* Suggestion Option Cards */}
                <div className="space-y-2.5 mb-4 max-h-[250px] overflow-y-auto pr-1">
                  {suggestions.map((item, idx) => {
                    const isPicked = selectedReview === item;
                    const labels = ['Warm & Enthusiastic', 'Detailed & Balanced', 'Concise & Direct'];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          triggerHaptic(10);
                          setSelectedReview(item);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed cursor-pointer transition-all active:scale-[0.99] relative ${
                          isPicked
                            ? 'border-slate-900 bg-white ring-2 ring-slate-950/10 shadow-md font-medium text-gray-900'
                            : 'border-gray-200 bg-gray-50/70 hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
                              isPicked ? 'bg-slate-950 border-slate-950 text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isPicked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                              Option {idx + 1} · {labels[idx] || 'Suggestion'}
                            </span>
                            <p>{item}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Editable review field */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Edit wording if desired</span>
                    <span className="text-[11px] text-gray-400 font-normal">Editable</span>
                  </div>
                  <textarea
                    value={selectedReview}
                    onChange={(e) => setSelectedReview(e.target.value)}
                    className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-black focus:bg-white resize-none shadow-xs font-medium"
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
                  className="w-full py-4 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ready to Post on Google</span>
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
                  className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition-colors active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Review
                </button>

                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Final Step
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 mt-1 font-heading">
                    Publish to Google Reviews
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Your polished text is copied to your clipboard. Click below to open Google and paste.
                  </p>
                </div>

                {/* Copied Review Card */}
                <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-xl relative border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Review text copied
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReview}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline cursor-pointer active:scale-95"
                    >
                      <Copy className="w-3 h-3" /> Re-copy
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 italic max-h-24 overflow-y-auto pr-1">
                    &ldquo;{selectedReview}&rdquo;
                  </p>
                </div>

                {/* 2 Step Flow Guidance */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-black text-xs flex-shrink-0">
                      1
                    </span>
                    <span className="text-gray-700">Click <strong>Open Google Reviews</strong> below</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-black text-xs flex-shrink-0">
                      2
                    </span>
                    <span className="text-gray-700">Paste your review & confirm your {rating}★ rating</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleOpenGoogle}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
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
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-5 shadow-lg">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <h1 className="text-3xl font-black text-gray-900 mb-2 font-heading">
                Thank you!
              </h1>

              <p className="text-xs text-gray-600 max-w-[280px] leading-relaxed mb-8">
                Your genuine feedback helps <strong className="text-gray-900">{business.name}</strong> provide exceptional service.
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
                className="w-full py-4 bg-slate-950 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-[0.98] cursor-pointer"
              >
                Submit Another Review
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="p-3 text-center bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
          Powered by <strong className="text-gray-700">Tapyy</strong> · Hardware NFC & QR Review Experience
        </footer>

        {/* Floating Toast Notification */}
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
