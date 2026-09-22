'use client';

import React, { useState, useEffect } from 'react';
import { Business, PhysicalCard, CardStatus } from '@/lib/types';
import { getAllBusinesses, getAllCards, issuePhysicalCard, updateCard, deleteCard } from '@/lib/data-service';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Shield,
  ExternalLink,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Download,
  Copy,
  Check,
  Power,
  Printer,
} from 'lucide-react';

export default function AdminCardsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cards, setCards] = useState<PhysicalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Issue Card Form State
  const [selectedBizId, setSelectedBizId] = useState('');
  const [cardName, setCardName] = useState('Front Counter Stand #1');
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

  // Copy Feedback State
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

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
      const code = customCode.trim() || `TAP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newCard = await issuePhysicalCard(selectedBizId, cardName.trim(), code);
      setMessage(`Issued physical card "${newCard.card_code}" (${newCard.name})!`);
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

      setMessage(`Card "${editCardCode.trim()}" successfully updated!`);
      setEditingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to update card details.';
      setErrorMsg(msg);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleToggleStatus(card: PhysicalCard) {
    const nextStatus: CardStatus = card.status === 'active' ? 'inactive' : 'active';
    try {
      await updateCard(card.id, { status: nextStatus });
      setMessage(`Card "${card.card_code}" is now ${nextStatus}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update status');
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCard) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCard(deletingCard.id);
      setMessage(`Card "${deletingCard.card_code}" (${deletingCard.name}) purged.`);
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

  function copyCardUrl(card: PhysicalCard) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tapyy.com';
    const url = `${origin}/r/${card.card_code}`;
    navigator.clipboard.writeText(url);
    setCopiedCardId(card.id);
    setTimeout(() => {
      setCopiedCardId(null);
    }, 2000);
  }

  function downloadStandQR(card: PhysicalCard) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tapyy.com';
    const cardUrl = `${origin}/r/${card.card_code}`;
    const bizName = card.business?.name || 'Tapyy Client';

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 720);

    // Border line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 568, 688);

    // Business Name & Card placement
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bizName, 300, 65);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(card.name, 300, 95);

    // Serialized SVG QR
    const svgElement = document.getElementById(`qr-svg-${card.id}`);
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 90, 130, 420, 420);

        // Footer instructions
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`TAP NFC OR SCAN QR TO REVIEW`, 300, 600);

        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`Card Code: ${card.card_code}`, 300, 635);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px monospace';
        ctx.fillText(cardUrl, 300, 665);

        const a = document.createElement('a');
        a.download = `tapyy-stand-${card.card_code}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = image64;
    }
  }

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.business?.name && card.business.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Shield className="w-4 h-4" /> Physical Hardware Fleet
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Physical Card Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue, bind, export print-ready QR stand artwork, and manage live NFC hardware across business tenants.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" /> Issue Physical Card
            </h2>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
              NFC + QR
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Assigns a physical NFC stand or card record tied to an active business tenant.
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Card Placement / Label *</label>
                <span className="text-[10px] text-gray-400">Physical Location</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Counter Stand #1, Table 4, Bar Stand"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Name of where this hardware unit sits in the physical venue.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Custom Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TAP-CTR01 (auto-generated if blank)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-mono font-bold uppercase"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Format: <code className="bg-gray-100 px-1 rounded font-mono">TAP-XXXXX</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedBizId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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

        {/* Card Registry Table & Controls */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Issued Cards Registry ({filteredCards.length})
              </h2>
              <p className="text-xs text-gray-500">Live hardware units currently deployed in the field.</p>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              {['all', 'active', 'inactive', 'unassigned'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-gray-900 shadow-xs font-extrabold'
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
              placeholder="Search by card code, label, or business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* Card Items List */}
          <div className="space-y-4">
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No physical cards matching your filters.
              </div>
            ) : (
              filteredCards.map((card) => {
                const url =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${card.card_code}`
                    : `https://tapyy.com/r/${card.card_code}`;

                const isCopied = copiedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 hover:border-gray-300 transition-all shadow-xs"
                  >
                    {/* Left: QR Code & Card Identity */}
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex-shrink-0 flex items-center justify-center">
                        <QRCodeSVG id={`qr-svg-${card.id}`} value={url} size={64} level="M" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                            {card.card_code}
                          </span>
                          <strong className="text-sm font-bold text-gray-900 truncate">
                            {card.name}
                          </strong>
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
                        <p className="text-xs text-gray-500">
                          Tenant Business:{' '}
                          <strong className="text-gray-900 font-bold">
                            {card.business?.name || 'Unassigned'}
                          </strong>
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate max-w-sm">{url}</p>
                      </div>
                    </div>

                    {/* Right: Actions Toolbar */}
                    <div className="flex items-center gap-2 w-full xl:w-auto justify-end flex-wrap pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-200">
                      {/* Copy Tap URL */}
                      <button
                        onClick={() => copyCardUrl(card)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Copy NFC URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      {/* Download Print Stand QR PNG */}
                      <button
                        onClick={() => downloadStandQR(card)}
                        className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Export High-Res Stand QR Artwork (PNG)"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" /> Stand Artwork
                      </button>

                      {/* Quick Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(card)}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                          card.status === 'active'
                            ? 'bg-white hover:bg-amber-50 text-amber-600 border-gray-200'
                            : 'bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200'
                        }`}
                        title={card.status === 'active' ? 'Deactivate Card' : 'Activate Card'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Test Tap Flow */}
                      <a
                        href={`/r/${card.card_code}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        Test <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Edit Details */}
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit Card Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingCard(card)}
                        className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Purge Card Hardware"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Physical Card
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Placement / Label *</label>
                <input
                  type="text"
                  required
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Code (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  value={editCardCode}
                  onChange={(e) => setEditCardCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-mono font-bold uppercase"
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
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
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

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Purge Hardware Record?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete card{' '}
                <strong className="text-gray-900 font-mono">{deletingCard.card_code}</strong> (
                {deletingCard.name})? Any customer tapping this physical card will see an unassigned card error.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex-1 transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Purging...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
