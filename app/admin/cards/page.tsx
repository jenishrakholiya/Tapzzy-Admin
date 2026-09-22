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
  Wifi,
  MapPin,
  Dices,
  Eye,
} from 'lucide-react';

const QUICK_LOCATIONS = [
  'Counter Stand #1',
  'Table Stand #4',
  'Bar Station',
  'Reception Desk',
  'VIP Table #1',
  'Patio Stand',
];

type StandStyle = 'obsidian' | 'frosted' | 'brass';

export default function AdminCardsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cards, setCards] = useState<PhysicalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [standStyle, setStandStyle] = useState<StandStyle>('obsidian');

  // Issue Card Form State
  const [selectedBizId, setSelectedBizId] = useState('');
  const [cardName, setCardName] = useState('Counter Stand #1');
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
      const [bizList, cardList] = await Promise.all([
        getAllBusinesses(),
        getAllCards(),
      ]);
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

  const selectedBiz = businesses.find((b) => b.id === selectedBizId);

  function generateRandomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'TAP-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCode(code);
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
      setMessage(`Issued stand "${newCard.card_code}" (${newCard.name})`);
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

      setMessage(`Updated "${editCardCode.trim()}"`);
      setEditingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to update stand.';
      setErrorMsg(msg);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleToggleStatus(card: PhysicalCard) {
    const nextStatus: CardStatus = card.status === 'active' ? 'inactive' : 'active';
    try {
      await updateCard(card.id, { status: nextStatus });
      setMessage(`Stand "${card.card_code}" set to ${nextStatus}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update status.');
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCard) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCard(deletingCard.id);
      setMessage(`Deleted "${deletingCard.card_code}"`);
      setDeletingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to delete stand.';
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

  // High-Resolution Print-Ready Artwork Export
  function downloadStandQR(card: PhysicalCard) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tapyy.com';
    const cardUrl = `${origin}/r/${card.card_code}`;
    const bizName = card.business?.name || 'Tapyy Client';

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1000);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(32, 32, 736, 936);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, 712, 912);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(300, 60, 200, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAPYY NFC STAND', 400, 84);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bizName, 400, 150);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(card.name.toUpperCase(), 400, 190);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 220);
    ctx.lineTo(650, 220);
    ctx.stroke();

    const svgElement = document.getElementById(`qr-svg-${card.id}`);
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(160, 260, 480, 480, 24);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.drawImage(img, 200, 300, 400, 400);

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('TAP PHONE OR SCAN QR', 400, 800);

        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('LEAVE A 5-STAR GOOGLE REVIEW', 400, 835);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`STAND CODE: ${card.card_code}`, 400, 885);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText(cardUrl, 400, 915);

        const a = document.createElement('a');
        a.download = `tapyy-stand-${card.card_code}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = image64;
    }
  }

  const activeCount = cards.filter((c) => c.status === 'active').length;
  const inactiveCount = cards.filter((c) => c.status === 'inactive').length;

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.business?.name && card.business.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const previewCode = customCode || 'TAP-PREVIEW';
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${previewCode}`
      : `https://tapyy.com/r/${previewCode}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Stands & Cards
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Issue NFC cards, export stand artwork, and manage venue hardware.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
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
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form & Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stand Mockup */}
          <div className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Wifi className="w-3 h-3 rotate-90" /> Live Stand Preview
              </span>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                {(['obsidian', 'frosted', 'brass'] as StandStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStandStyle(st)}
                    className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                      standStyle === st ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Stand Body */}
            <div
              className={`rounded-2xl p-4 shadow-lg flex flex-col items-center text-center space-y-2.5 transition-all ${
                standStyle === 'obsidian'
                  ? 'bg-gradient-to-b from-slate-900 to-black text-white border border-slate-800'
                  : standStyle === 'frosted'
                  ? 'bg-gradient-to-b from-white to-slate-100 text-slate-900 border border-slate-200'
                  : 'bg-gradient-to-b from-amber-950 to-black text-amber-100 border border-amber-800/60'
              }`}
            >
              <div className="w-full flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-xs font-black">tapyy</span>
                <span className="text-[9px] font-mono bg-white/10 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  {previewCode}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-black truncate max-w-[220px]">
                  {selectedBiz?.name || 'Select Business'}
                </p>
                <p className="text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{cardName || 'Stand #1'}</span>
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-xl shadow-xs">
                <QRCodeSVG value={previewUrl} size={96} level="M" />
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider">
                Tap Phone or Scan QR
              </p>

              <a
                href={`/r/${previewCode}`}
                target="_blank"
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" /> Test Flow
              </a>
            </div>
          </div>

          {/* Issue Stand Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
              <Plus className="w-4 h-4 text-emerald-600" /> Issue Stand
            </h2>

            <form onSubmit={handleIssueCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Business</label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Placement / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Stand #1"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setCardName(loc)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        cardName === loc
                          ? 'bg-slate-900 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Code (Optional)</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" /> Randomize
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono font-bold uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedBizId}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Issuing...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Issue Stand
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Stands Registry */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-black text-gray-900 font-heading">
              Stands ({filteredCards.length})
            </h2>

            {/* Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: `All (${cards.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'inactive', label: `Paused (${inactiveCount})` },
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

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No stands found.
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
                    className="p-3.5 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-xs flex-shrink-0">
                          <QRCodeSVG id={`qr-svg-${card.id}`} value={url} size={40} level="M" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded">
                              {card.card_code}
                            </span>
                            <strong className="text-xs font-extrabold text-gray-900 truncate">
                              {card.name}
                            </strong>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {card.business?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                          card.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-200/60 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyCardUrl(card)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                        </button>

                        <button
                          onClick={() => downloadStandQR(card)}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-blue-600" />
                          <span>Artwork</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(card)}
                          className="p-1.5 rounded-lg border bg-white hover:bg-gray-100 text-gray-600 border-gray-200 cursor-pointer"
                          title={card.status === 'active' ? 'Pause stand' : 'Activate stand'}
                        >
                          <Power className="w-3 h-3" />
                        </button>

                        <a
                          href={`/r/${card.card_code}`}
                          target="_blank"
                          className="px-2.5 py-1 bg-slate-950 text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-black"
                        >
                          Test <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <button
                          onClick={() => openEditModal(card)}
                          className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setDeletingCard(card)}
                          className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 font-heading">
                <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Edit Stand
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Business</label>
                <select
                  value={editBizId}
                  onChange={(e) => setEditBizId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold text-gray-900"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Placement / Label</label>
                <input
                  type="text"
                  required
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={editCardCode}
                  onChange={(e) => setEditCardCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CardStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-bold capitalize text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl animate-fade-in text-center">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 font-heading">Delete Stand?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong className="font-mono text-gray-900">{deletingCard.card_code}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
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
