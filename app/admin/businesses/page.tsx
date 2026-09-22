'use client';

import React, { useState, useEffect } from 'react';
import { Business, BusinessStatus } from '@/lib/types';
import { getAllBusinesses, createBusiness, updateBusiness, deleteBusiness } from '@/lib/data-service';
import {
  Plus,
  Globe,
  CheckCircle2,
  AlertCircle,
  Shield,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Building2,
  ExternalLink,
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
      setMessage(`Successfully onboarded business "${newBiz.name}"!`);
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
      setMessage(`Business "${editName.trim()}" updated successfully!`);
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
      setMessage(`Business "${deletingBiz.name}" deleted successfully.`);
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
  const suspendedCount = businesses.filter((b) => b.status === 'suspended').length;

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesSearch =
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || biz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Shield className="w-4 h-4" /> Multi-Tenant Accounts
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Business Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Register client tenant profiles, manage target Google Review URLs, and bind hardware cards.
          </p>
        </div>

        <button
          onClick={() => loadBusinesses()}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Accounts
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{businesses.length}</div>
            <div className="text-[11px] text-gray-400 font-medium">Total Clients</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">{activeCount}</div>
            <div className="text-[11px] text-gray-400 font-medium">Active Tenants</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600">{suspendedCount}</div>
            <div className="text-[11px] text-gray-400 font-medium">Suspended</div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Onboarding Form */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 font-heading">
              <Plus className="w-5 h-5 text-blue-600" /> Onboard Business
            </h2>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase">
              New Account
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bella Italia Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Emoji Icon</label>
              <input
                type="text"
                placeholder="e.g. 🍕 or https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">Single emoji or image URL</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Google Review URL</label>
              <input
                type="url"
                placeholder="https://g.page/r/your-review-link/review"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Where customer taps will be directed to submit on Google.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Onboarding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Onboard Business
                </>
              )}
            </button>
          </form>
        </div>

        {/* Businesses Directory */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-heading">
                Client Accounts ({filteredBusinesses.length})
              </h2>
              <p className="text-xs text-gray-500">Live multi-tenant accounts in the database.</p>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto overflow-x-auto">
              {[
                { id: 'all', label: `All (${businesses.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'suspended', label: `Suspended (${suspendedCount})` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-white text-gray-900 shadow-xs font-extrabold'
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
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* Responsive Directory (Card Stack on Mobile, Clean Table on Tablet/Desktop) */}
          <div className="space-y-3">
            {filteredBusinesses.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                No businesses found matching your filters.
              </div>
            ) : (
              filteredBusinesses.map((biz) => {
                const isSlugCopied = copiedSlugId === biz.id;

                return (
                  <div
                    key={biz.id}
                    className="p-4 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-extrabold text-gray-900 truncate">
                            {biz.name}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
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
                            title="Click to copy slug"
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
                            <Globe className="w-3 h-3" /> Google Review Link ↗
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openEditModal(biz)}
                        className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingBiz(biz)}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Business Profile
              </h3>
              <button
                onClick={() => setEditingBiz(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Emoji Icon</label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Google Review URL</label>
                <input
                  type="url"
                  required
                  value={editGoogleReviewUrl}
                  onChange={(e) => setEditGoogleReviewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tenant Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as BusinessStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-bold capitalize text-gray-900 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingBiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900 font-heading">Delete Business Tenant?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-gray-900">{deletingBiz.name}</strong>?
                Any physical cards assigned to this business will lose their binding.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBiz(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex-1 transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
