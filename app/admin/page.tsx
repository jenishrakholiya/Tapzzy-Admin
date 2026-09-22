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
  Shield,
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Shield className="w-4 h-4" /> Live Fleet Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-heading">
            Super Admin Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage business accounts, deploy physical Tapyy NFC cards, and monitor customer review conversions.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/businesses"
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Business
          </Link>
          <Link
            href="/admin/cards"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" /> Issue Cards
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Tenants</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{businesses.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">Active client businesses</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deployed Cards</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{cards.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">{activeCardsCount} active live stands</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Taps & Reviews</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalReviews}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">{googleConverted} pasted to Google</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Star Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{avgRating} / 5.0</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Platform satisfaction</div>
        </div>
      </div>

      {/* Grid Section: Businesses & Issued Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Businesses Table */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-black text-gray-900 font-heading">Registered Businesses</h2>
            </div>
            <Link href="/admin/businesses" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All ({businesses.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No businesses created yet. Click <strong>Add Business</strong> above to onboard your first client.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {businesses.slice(0, 5).map((biz) => (
                <div key={biz.id} className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-sm font-extrabold text-gray-900 truncate">{biz.name}</strong>
                      <span className="text-xs text-gray-400 font-mono truncate block">slug: {biz.slug}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize self-start sm:self-auto flex-shrink-0">
                    {biz.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issued Physical Cards Table with Test Tap Links */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-black text-gray-900 font-heading">Hardware Stands & Cards</h2>
            </div>
            <Link href="/admin/cards" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              Manage Fleet ({cards.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No cards issued yet. Click <strong>Issue Cards</strong> above to assign your first NFC stand.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cards.slice(0, 5).map((card) => {
                const associatedBiz = card.business?.name || businessMap.get(card.business_id)?.name || 'Assigned';
                return (
                  <div key={card.id} className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                          {card.card_code}
                        </span>
                        <strong className="text-sm font-extrabold text-gray-900 truncate">{card.name}</strong>
                      </div>
                      <span className="text-xs text-gray-400 truncate block mt-0.5">Assigned to: {associatedBiz}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/r/${card.card_code}`}
                        target="_blank"
                        className="text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-200 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Wifi className="w-3 h-3 text-slate-900 rotate-90" /> Test Tap <ExternalLink className="w-3 h-3 text-slate-600" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Live Feedback Activity Feed */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-black text-gray-900 font-heading">Recent Customer Reviews & Tap Feed</h2>
          </div>
          <Link
            href="/admin/reviews"
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            All Reviews ({reviews.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No reviews logged yet. Tap a live card or use Test Tap Flow to generate your first customer feedback.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.slice(0, 4).map((rev) => {
              const biz = rev.business_name || businessMap.get(rev.business_id)?.name || 'Client';
              const rating = rev.rating || 5;

              return (
                <div key={rev.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-extrabold text-gray-900">{biz}</strong>
                      {rev.card_code && (
                        <span className="text-[10px] font-mono bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-bold">
                          {rev.card_code}
                        </span>
                      )}
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.google_clicked && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied to Google
                      </span>
                    )}
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      &ldquo;{rev.feedback}&rdquo;
                    </p>
                  )}

                  {rev.review_text && (
                    <p className="text-xs text-gray-900 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
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
