'use client';

import React, { useState, useEffect } from 'react';
import { Business, BusinessStatus } from '@/lib/types';
import { getAllBusinesses, createBusiness, updateBusiness, deleteBusiness } from '@/lib/data-service';
import { Plus, Globe, CheckCircle2, AlertCircle, Shield, Search, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

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
      const url = googleReviewUrl.trim() || `https://www.google.com/search?q=${encodeURIComponent(name)}+Google+reviews`;
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

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesSearch =
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || biz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Shield className="w-4 h-4" /> Super Admin Control
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Full DB layer CRUD: Register, inspect, edit tenant profiles, change status, or purge businesses.
          </p>
        </div>

        <button
          onClick={() => loadBusinesses()}
          className="self-start sm:self-auto px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboarding Form (INSERT) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" /> Onboard New Business
          </h2>
          <p className="text-xs text-gray-500">
            Adds a new tenant row directly into the database layer (`public.businesses`).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bella Italia Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
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
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Google Review URL</label>
              <input
                type="url"
                placeholder="https://g.page/r/your-review-link/review"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to auto-generate a search link.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving to DB...
                </>
              ) : (
                'Onboard Business Tenant'
              )}
            </button>
          </form>
        </div>

        {/* Business Table & Management Controls (READ, UPDATE, DELETE) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-gray-900">
              Tenant Businesses ({filteredBusinesses.length})
            </h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              {['all', 'active', 'suspended', 'inactive'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {st}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Business</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Review Link</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No businesses found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-base border border-gray-200/60">
                            {biz.logo_url && biz.logo_url.length <= 4 ? biz.logo_url : biz.name.charAt(0)}
                          </span>
                          <div>
                            <strong className="text-gray-900 font-bold text-xs block">{biz.name}</strong>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {biz.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-500">{biz.slug}</td>
                      <td className="p-3 max-w-[160px] truncate text-blue-600">
                        <a
                          href={biz.google_review_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:underline text-xs font-semibold"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" /> Open Link ↗
                        </a>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-block ${
                            biz.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : biz.status === 'suspended'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {biz.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(biz)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit Business"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingBiz(biz)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete Business"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT BUSINESS MODAL (UPDATE) */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Business Tenant
              </h3>
              <button
                onClick={() => setEditingBiz(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
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
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Google Review URL</label>
                <input
                  type="url"
                  required
                  value={editGoogleReviewUrl}
                  onChange={(e) => setEditGoogleReviewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as BusinessStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-bold capitalize text-gray-900"
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
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    'Save Database Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BUSINESS CONFIRMATION MODAL (DELETE) */}
      {deletingBiz && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Delete Business?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed font-medium">
              Are you sure you want to delete business tenant <strong>&quot;{deletingBiz.name}&quot;</strong>?
              This will permanently delete the business and cascade delete all assigned NFC cards and review sessions from the database layer.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBiz(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Purging DB Record...
                  </>
                ) : (
                  'Confirm DB Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
