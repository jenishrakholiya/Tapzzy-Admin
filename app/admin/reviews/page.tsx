'use client';

import React, { useState, useEffect } from 'react';
import { Business, ReviewSession } from '@/lib/types';
import { getAllBusinesses, getReviewsForBusiness } from '@/lib/data-service';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  TrendingUp,
  Search,
  RefreshCw,
  Building2,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bizList, revList] = await Promise.all([
        getAllBusinesses(),
        getReviewsForBusiness(),
      ]);
      setBusinesses(bizList);
      setReviews(revList);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  const businessMap = new Map(businesses.map((b) => [b.id, b]));

  const filteredReviews = reviews.filter((rev) => {
    const matchesBiz = selectedBiz === 'all' || rev.business_id === selectedBiz;

    let matchesRating = true;
    if (ratingFilter === '5') matchesRating = (rev.rating || 5) === 5;
    else if (ratingFilter === '4') matchesRating = (rev.rating || 5) === 4;
    else if (ratingFilter === 'low') matchesRating = (rev.rating || 5) <= 3;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      (rev.feedback && rev.feedback.toLowerCase().includes(query)) ||
      (rev.review_text && rev.review_text.toLowerCase().includes(query)) ||
      (rev.business_name && rev.business_name.toLowerCase().includes(query)) ||
      (rev.card_code && rev.card_code.toLowerCase().includes(query));

    return matchesBiz && matchesRating && matchesSearch;
  });

  const totalReviews = reviews.length;
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';
  const googleConverted = reviews.filter((r) => r.google_clicked).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Reviews
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Customer ratings, feedback notes, and Google conversions.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Taps</span>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{totalReviews}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Avg Rating</span>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{avgRating} ★</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">To Google</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{googleConverted}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedBiz}
              onChange={(e) => setSelectedBiz(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">All Businesses ({businesses.length})</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-bold overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: '5', label: '5★' },
              { id: '4', label: '4★' },
              { id: 'low', label: '1-3★' },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setRatingFilter(rf.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  ratingFilter === rf.id
                    ? 'bg-white text-gray-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Review List */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-black text-gray-900 font-heading">
          Feedback ({filteredReviews.length})
        </h2>

        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No reviews matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((rev) => {
              const biz = rev.business_name || businessMap.get(rev.business_id)?.name || 'Business';
              const rating = rev.rating || 5;
              const dateFormatted = new Date(rev.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={rev.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-gray-900">{biz}</span>
                      {rev.card_code && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {rev.card_code}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-amber-400">
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

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{dateFormatted}</span>
                      {rev.google_clicked && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google
                        </span>
                      )}
                    </div>
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-gray-600 italic">
                      &ldquo;{rev.feedback}&rdquo;
                    </p>
                  )}

                  {rev.review_text && (
                    <div className="p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 flex items-start gap-2">
                      <span className="text-gray-400 font-serif text-sm leading-none mt-0.5">&ldquo;</span>
                      <p className="leading-relaxed flex-1">{rev.review_text}&rdquo;</p>
                    </div>
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
