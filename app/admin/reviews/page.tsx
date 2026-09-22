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
  ExternalLink,
  Shield,
  Building2,
  Sparkles,
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
  const conversionRate = totalReviews ? Math.round((googleConverted / totalReviews) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            <Shield className="w-4 h-4" /> Live Customer Feedback Feed
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reviews & Tap Activity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track real customer interactions, rating distributions, and AI review conversions across all physical stands.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Reviews
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customer Taps</span>
            <MessageSquare className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{totalReviews}</div>
          <div className="text-xs text-gray-400 mt-1">NFC taps converted to reviews</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{avgRating} / 5.0</div>
          <div className="text-xs text-gray-400 mt-1">Platform-wide satisfaction</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Google Conversion</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{conversionRate}%</div>
          <div className="text-xs text-gray-400 mt-1">{googleConverted} pasted directly to Google</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Business Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={selectedBiz}
              onChange={(e) => setSelectedBiz(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-black"
            >
              <option value="all">All Businesses ({businesses.length})</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filters */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-start md:self-auto">
            {[
              { id: 'all', label: 'All Ratings' },
              { id: '5', label: '5 Stars ★' },
              { id: '4', label: '4 Stars ★' },
              { id: 'low', label: '1-3 Stars' },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setRatingFilter(rf.id)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  ratingFilter === rf.id
                    ? 'bg-white text-gray-900 shadow-xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback text, AI reviews, business name, or card code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
          />
        </div>
      </div>

      {/* Review Feed Items */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-gray-900">
          Customer Submissions ({filteredReviews.length})
        </h2>

        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No customer reviews matching your current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((rev) => {
              const biz = rev.business_name || businessMap.get(rev.business_id)?.name || 'Tenant Business';
              const rating = rev.rating || 5;
              const dateFormatted = new Date(rev.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={rev.id} className="py-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-extrabold text-gray-900">{biz}</span>
                      {rev.card_code && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {rev.card_code}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{dateFormatted}</span>
                      {rev.google_clicked ? (
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied to Google
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                          Drafted Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Raw Feedback Note */}
                  {rev.feedback && (
                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700">
                      <strong className="text-gray-900 font-bold block text-[11px] mb-0.5 text-slate-500 uppercase tracking-wider">
                        Customer Feedback Note:
                      </strong>
                      &ldquo;{rev.feedback}&rdquo;
                    </div>
                  )}

                  {/* Polished / Selected AI Review */}
                  {rev.review_text && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-gray-900 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-[11px] text-amber-800 font-bold block uppercase tracking-wider">
                          Final Polished Review:
                        </strong>
                        <p className="leading-relaxed font-medium">{rev.review_text}</p>
                      </div>
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
