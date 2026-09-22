'use client';

import React, { useState, useEffect } from 'react';
import { Business, PhysicalCard, CardStatus } from '@/lib/types';
import { getAllBusinesses, getAllCards, issuePhysicalCard, updateCard, deleteCard } from '@/lib/data-service';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Plus, CheckCircle2, AlertCircle, Shield, ExternalLink, Search, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

export default function AdminCardsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cards, setCards] = useState<PhysicalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Issue Card Form State
  const [selectedBizId, setSelectedBizId] = useState('');
  const [cardName, setCardName] = useState('Front Counter NFC Stand');
  const [customCode, setCustomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Card Modal State
  const [editingCard, setEditingCard] = useState<PhysicalCard | null>(null);
  const [editCardName, setEditCardName] = useState('');
  const [editCardCode, setEditCardCode] = useState('');
  const [editBizId, setEditBizId] = useState('');
  const [editStatus, setEditStatus] = useState<CardStatus>('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Card Modal State
  const [deletingCard, setDeletingCard] = useState<PhysicalCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const bizList = await getAllBusinesses();
      const cardList = await getAllCards();
      setBusinesses(bizList);
      setCards(cardList);
      if (bizList.length > 0 && !selectedBizId) {
        setSelectedBizId(bizList[0].id);
      }
    } catch (err) {
      console.error('Error loading card data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueCard(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBizId || !cardName.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const code = customCode.trim() || `${cards.length + 1}-${Math.random().toString(36).substring(2, 7)}`;
      const newCard = await issuePhysicalCard(selectedBizId, cardName.trim(), code);
      setMessage(`Issued card code "${newCard.card_code}" for "${newCard.business?.name || 'Business'}"!`);
      setCardName('Table Stand #' + (cards.length + 1));
      setCustomCode('');
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to issue card.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(card: PhysicalCard) {
    setEditingCard(card);
    setEditCardName(card.name);
    setEditCardCode(card.card_code);
    setEditBizId(card.business_id);
    setEditStatus(card.status);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCard || !editCardName.trim() || !editCardCode.trim()) return;

    setIsSavingEdit(true);
    setErrorMsg(null);

    try {
      await updateCard(editingCard.id, {
        name: editCardName.trim(),
        card_code: editCardCode.trim(),
        business_id: editBizId,
        status: editStatus,
      });
      setMessage(`Card "${editCardCode.trim()}" updated successfully!`);
      setEditingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to update card.';
      setErrorMsg(msg);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCard) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCard(deletingCard.id);
      setMessage(`Card "${deletingCard.card_code}" removed from database.`);
      setDeletingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to delete card.';
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredCards = cards.filter((card) => {
    const bizName = card.business?.name || '';
    const matchesSearch =
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bizName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Shield className="w-4 h-4" /> Super Admin Card Issuance Engine
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Physical Cards & Hardware</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate, update, re-assign, and manage physical NFC & QR cards linked directly to tenant database records.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
        </button>
      </div>

      {/* Notifications */}
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
        {/* Issue Card Form (INSERT) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" /> Issue New Physical Card
          </h2>
          <p className="text-xs text-gray-500">
            Creates a new card hardware record in `public.cards` tied to a tenant.
          </p>

          <form onSubmit={handleIssueCard} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Business Tenant *</label>
              <select
                value={selectedBizId}
                onChange={(e) => setSelectedBizId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold text-gray-900"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Card Placement / Label *</label>
              <input
                type="text"
                required
                placeholder="e.g. Counter Stand #1"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Custom Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 1-123ab (auto-generated if blank)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-mono font-bold"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Format: <code className="bg-gray-100 px-1 rounded font-mono">1-123ab</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedBizId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Issuing Card...
                </>
              ) : (
                'Issue Physical Card'
              )}
            </button>
          </form>
        </div>

        {/* Card Registry Table & Controls (READ, UPDATE, DELETE) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-gray-900">
              Issued Cards Registry ({filteredCards.length})
            </h2>

            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              {['all', 'active', 'inactive', 'unassigned'].map((st) => (
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
              placeholder="Search by card code, label, or assigned business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* Card Items List */}
          <div className="space-y-4">
            {filteredCards.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No physical cards matching your filters.
              </div>
            ) : (
              filteredCards.map((card) => {
                const url =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${card.card_code}`
                    : `https://tapyy.com/r/${card.card_code}`;

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex-shrink-0">
                        <QRCodeSVG value={url} size={64} level="M" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded">
                            {card.card_code}
                          </span>
                          <strong className="text-sm font-bold text-gray-900">{card.name}</strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              card.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : card.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {card.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned Tenant:{' '}
                          <strong className="text-gray-900 font-bold">
                            {card.business?.name || 'Unassigned'}
                          </strong>
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <a
                        href={`/r/${card.card_code}`}
                        target="_blank"
                        className="px-3 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        Test Flow <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-xl transition-colors"
                        title="Edit Card Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCard(card)}
                        className="p-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-xl transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EDIT CARD MODAL (UPDATE) */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" /> Edit Card Details
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Tenant Business</label>
                <select
                  value={editBizId}
                  onChange={(e) => setEditBizId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold text-gray-900"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Placement / Label</label>
                <input
                  type="text"
                  required
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Code (Unique Slug)</label>
                <input
                  type="text"
                  required
                  value={editCardCode}
                  onChange={(e) => setEditCardCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CardStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-bold capitalize text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
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

      {/* DELETE CARD CONFIRMATION MODAL (DELETE) */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Delete Card Code?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed font-medium">
              Are you sure you want to delete card <strong>&quot;{deletingCard.name}&quot;</strong> (Code: <code className="font-mono">{deletingCard.card_code}</code>)?
              This will remove the physical hardware code from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
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
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting Card...
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
