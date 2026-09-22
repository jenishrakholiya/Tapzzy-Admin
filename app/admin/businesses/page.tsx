'use client';

import React, { useState, useEffect } from 'react';
import { Business, BusinessStatus } from '@/lib/types';
import { getAllBusinesses, createBusiness, updateBusiness, deleteBusiness } from '@/lib/data-service';
import {
  Plus,
  Globe,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Business Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('☕');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editGoogleReviewUrl, setEditGoogleReviewUrl] = useState('');
  const [editStatus, setEditStatus] = useState<BusinessStatus>('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingBiz, setDeletingBiz] = useState<Business | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const list = await getAllBusinesses();
      setBusinesses(list);
    } catch (err) {
      console.error('Error loading businesses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const url =
        googleReviewUrl.trim() ||
        `https://www.google.com/search?q=${encodeURIComponent(name)}+Google+reviews`;
      const newBiz = await createBusiness(name.trim(), logoUrl.trim(), url);
      setMessage(`Added business "${newBiz.name}"`);
      setName('');
      setGoogleReviewUrl('');
      await loadBusinesses();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to onboard business.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(biz: Business) {
    setEditingBiz(biz);
    setEditName(biz.name);
    setEditLogoUrl(biz.logo_url || '');
    setEditGoogleReviewUrl(biz.google_review_url);
    setEditStatus(biz.status);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBiz || !editName.trim()) return;

    setIsSavingEdit(true);
    setErrorMsg(null);
    try {
      await updateBusiness(editingBiz.id, {
        name: editName.trim(),
        logo_url: editLogoUrl.trim(),
        google_review_url: editGoogleReviewUrl.trim(),
        status: editStatus,
      });
      setMessage(`Updated "${editName.trim()}"`);
      setEditingBiz(null);
      await loadBusinesses();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to update business.';
      setErrorMsg(msg);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingBiz) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteBusiness(deletingBiz.id);
      setMessage(`Deleted "${deletingBiz.name}"`);
      setDeletingBiz(null);
      await loadBusinesses();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to delete business.';
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  function copySlug(biz: Business) {
    navigator.clipboard.writeText(biz.slug);
    setCopiedSlugId(biz.id);
    setTimeout(() => setCopiedSlugId(null), 2000);
  }

  const activeCount = businesses.filter((b) => b.status === 'active').length;

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesSearch =
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || biz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Businesses
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage client venues and Google review URLs.
          </p>
        </div>

        <button
          onClick={() => loadBusinesses()}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Onboarding Form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
            <Plus className="w-4 h-4 text-blue-600" /> Add Business
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Bella Italia Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Emoji</label>
              <input
                type="text"
                placeholder="e.g. 🍕 or URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Google Review URL</label>
              <input
                type="url"
                placeholder="https://g.page/r/.../review"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add Business
                </>
              )}
            </button>
          </form>
        </div>

        {/* Businesses Directory */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-black text-gray-900 font-heading">
              Accounts ({filteredBusinesses.length})
            </h2>

            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: `All (${businesses.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'suspended', label: 'Suspended' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all whitespace-nowrap cursor-pointer text-[11px] ${
                    statusFilter === st.id
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* Business Items */}
          <div className="space-y-2.5">
            {filteredBusinesses.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No businesses found.
              </div>
            ) : (
              filteredBusinesses.map((biz) => {
                const isSlugCopied = copiedSlugId === biz.id;

                return (
                  <div
                    key={biz.id}
                    className="p-3.5 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center font-bold text-base flex-shrink-0">
                        {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs font-extrabold text-gray-900 truncate">
                            {biz.name}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              biz.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {biz.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          <button
                            type="button"
                            onClick={() => copySlug(biz)}
                            className="font-mono text-[11px] text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                          >
                            {isSlugCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>slug: {biz.slug}</span>
                          </button>

                          <a
                            href={biz.google_review_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Globe className="w-3 h-3" /> Google Link ↗
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => openEditModal(biz)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingBiz(biz)}
                        className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 font-heading">
                <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Edit Business
              </h3>
              <button
                onClick={() => setEditingBiz(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Emoji</label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Google Review URL</label>
                <input
                  type="url"
                  required
                  value={editGoogleReviewUrl}
                  onChange={(e) => setEditGoogleReviewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as BusinessStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-bold capitalize text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl animate-fade-in text-center">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 font-heading">Delete Business?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong>{deletingBiz.name}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBiz(null)}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex-1 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
