import React from 'react';
import { getAllBusinesses, getAllCards, getReviewsForBusiness } from '@/lib/data-service';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Wifi,
} from 'lucide-react';

export default async function AdminOverviewPage() {
  const businesses = await getAllBusinesses();
  const cards = await getAllCards();
  const reviews = await getReviewsForBusiness();

  const businessMap = new Map(businesses.map((b) => [b.id, b]));

  const totalReviews = reviews.length;
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';
  const googleConverted = reviews.filter((r) => r.google_clicked).length;
  const activeCardsCount = cards.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-heading">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Overview of client businesses, hardware stands, and customer feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/businesses"
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Business
          </Link>
          <Link
            href="/admin/cards"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" /> Issue Card
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Businesses</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{businesses.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Active accounts</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hardware Stands</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{cards.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{activeCardsCount} active</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer Taps</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalReviews}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-0.5">{googleConverted} to Google</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Avg Rating</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{avgRating} / 5.0</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Overall score</div>
        </div>
      </div>

      {/* Grid: Businesses & Stands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Businesses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 font-heading">Businesses</h2>
            <Link href="/admin/businesses" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View all ({businesses.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No businesses created yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {businesses.slice(0, 5).map((biz) => (
                <div key={biz.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-extrabold text-gray-900 truncate">{biz.name}</strong>
                      <span className="text-[11px] text-gray-400 font-mono truncate block">slug: {biz.slug}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize flex-shrink-0">
                    {biz.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stands */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 font-heading">Stands</h2>
            <Link href="/admin/cards" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              Manage ({cards.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No cards issued yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cards.slice(0, 5).map((card) => {
                const associatedBiz = card.business?.name || businessMap.get(card.business_id)?.name || 'Assigned';
                return (
                  <div key={card.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded">
                          {card.card_code}
                        </span>
                        <strong className="text-xs font-extrabold text-gray-900 truncate">{card.name}</strong>
                      </div>
                      <span className="text-[11px] text-gray-400 truncate block mt-0.5">{associatedBiz}</span>
                    </div>

                    <Link
                      href={`/r/${card.card_code}`}
                      target="_blank"
                      className="text-xs font-bold text-slate-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/80 active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
                    >
                      <Wifi className="w-3 h-3 text-amber-600 rotate-90" /> Test <ExternalLink className="w-3 h-3 text-gray-500" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews Feed */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-black text-gray-900 font-heading">Recent Reviews</h2>
          </div>
          <Link
            href="/admin/reviews"
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            All reviews ({reviews.length}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No customer reviews logged yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.slice(0, 4).map((rev) => {
              const biz = rev.business_name || businessMap.get(rev.business_id)?.name || 'Client';
              const rating = rev.rating || 5;

              return (
                <div key={rev.id} className="py-3 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-xs font-extrabold text-gray-900">{biz}</strong>
                      {rev.card_code && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {rev.card_code}
                        </span>
                      )}
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.google_clicked && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Posted on Google
                      </span>
                    )}
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-gray-600 italic">
                      &ldquo;{rev.feedback}&rdquo;
                    </p>
                  )}

                  {rev.review_text && (
                    <p className="text-xs text-gray-900 bg-amber-50/70 p-2 rounded-xl border border-amber-100/80 flex items-start gap-1.5 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{rev.review_text}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
