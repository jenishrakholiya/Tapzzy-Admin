import React from 'react';
import { getAllBusinesses, getAllCards, getReviewsForBusiness } from '@/lib/data-service';
import Link from 'next/link';
import { Building2, CreditCard, Star, TrendingUp, Plus, ArrowRight, Sparkles } from 'lucide-react';

export default async function AdminOverviewPage() {
  const businesses = await getAllBusinesses();
  const cards = await getAllCards();
  const reviews = await getReviewsForBusiness();

  const businessMap = new Map(businesses.map((b) => [b.id, b]));

  const totalReviews = reviews.length;
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-heading">
            Super Admin Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage business accounts, issue physical Tapyy NFC cards, and track platform customer activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/businesses"
            className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Business
          </Link>
          <Link
            href="/admin/cards"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" /> Issue Cards
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Businesses</span>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{businesses.length}</div>
          <div className="text-xs text-gray-400 mt-1">Active client accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Issued Physical Cards</span>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{cards.length}</div>
          <div className="text-xs text-gray-400 mt-1">NFC & QR hardware deployed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reviews Completed</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{totalReviews}</div>
          <div className="text-xs text-gray-400 mt-1">Across all deployed cards</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Avg Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{avgRating} / 5.0</div>
          <div className="text-xs text-gray-400 mt-1">Customer satisfaction</div>
        </div>
      </div>

      {/* Grid Section: Businesses & Issued Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Businesses Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900">Registered Businesses</h2>
            <Link href="/admin/businesses" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All ({businesses.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No businesses created yet. Click <strong>Add Business</strong> above to onboard your first account.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {businesses.slice(0, 5).map((biz) => (
                <div key={biz.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-sm">
                      {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-gray-900">{biz.name}</strong>
                      <span className="text-xs text-gray-400 font-mono">slug: {biz.slug}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {biz.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issued Physical Cards Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900">Issued Physical Cards</h2>
            <Link href="/admin/cards" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              Manage Cards ({cards.length}) <ArrowRight className="w-3.5 h-3.5" />
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
                  <div key={card.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded">
                          {card.card_code}
                        </span>
                        <strong className="text-sm font-bold text-gray-900">{card.name}</strong>
                      </div>
                      <span className="text-xs text-gray-400">Assigned to: {associatedBiz}</span>
                    </div>

                    <Link
                      href={`/r/${card.card_code}`}
                      target="_blank"
                      className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/80 active:scale-95 transition-all"
                    >
                      Test Tap ↗
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
