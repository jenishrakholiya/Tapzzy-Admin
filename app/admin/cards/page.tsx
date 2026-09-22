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
  Sparkles,
  Wifi,
  QrCode,
  Layers,
  MapPin,
  Dices,
  Eye,
  Store,
} from 'lucide-react';

const QUICK_LOCATION_CATEGORIES = [
  {
    category: 'Counters & Registers',
    items: ['Counter Stand #1', 'Order Register #2', 'Pick-up Counter', 'Bar Station'],
  },
  {
    category: 'Tables & Seating',
    items: ['Table Stand #4', 'Booth #8', 'VIP Lounge #1', 'Patio Table #6'],
  },
  {
    category: 'Reception & Service',
    items: ['Reception Desk', 'Host Station', 'Checkout Stand'],
  },
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
      setMessage(`Card "${card.card_code}" status updated to ${nextStatus}.`);
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
      setMessage(`Card "${deletingCard.card_code}" (${deletingCard.name}) deleted.`);
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

  // Print-ready High-Resolution Canvas Stand Artwork Export
  function downloadStandQR(card: PhysicalCard) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tapyy.com';
    const cardUrl = `${origin}/r/${card.card_code}`;
    const bizName = card.business?.name || 'Tapyy Client';

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1000);

    // Decorative outer border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(32, 32, 736, 936);

    // Subtle inner gold accent border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, 712, 912);

    // Header Badge: Tapyy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(300, 60, 200, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAPYY NFC STAND', 400, 84);

    // Business Name
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bizName, 400, 150);

    // Card placement badge
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(card.name.toUpperCase(), 400, 190);

    // Line separator
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 220);
    ctx.lineTo(650, 220);
    ctx.stroke();

    // SVG QR Serialization
    const svgElement = document.getElementById(`qr-svg-${card.id}`);
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;

      const img = new Image();
      img.onload = () => {
        // QR Code box background
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(160, 260, 480, 480, 24);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw QR
        ctx.drawImage(img, 200, 300, 400, 400);

        // NFC waves callout
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('TAP PHONE OR SCAN QR', 400, 800);

        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('LEAVE A 5-STAR GOOGLE REVIEW IN SECONDS', 400, 835);

        // Stand Code & URL
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

  const previewCode = customCode || 'TAP-DEMO1';
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${previewCode}`
      : `https://tapyy.com/r/${previewCode}`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Shield className="w-4 h-4" /> Physical Hardware Fleet
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Physical Card & Stand Issuer
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Issue, bind, export print-ready QR stand artwork, and test live NFC hardware stands across business tenants.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Fleet
        </button>
      </div>

      {/* Fleet Metric Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-gray-900">{cards.length}</div>
            <div className="text-[11px] text-gray-400 font-medium truncate">Total Hardware Units</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-emerald-600">{activeCount}</div>
            <div className="text-[11px] text-gray-400 font-medium truncate">Active Live Stands</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Power className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-amber-600">{inactiveCount}</div>
            <div className="text-[11px] text-gray-400 font-medium truncate">Paused Stands</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-blue-600">{businesses.length}</div>
            <div className="text-[11px] text-gray-400 font-medium truncate">Tenant Clients</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
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
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Card Issuance Form & Live Hardware Stand Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Physical Stand Mockup Card */}
          <div className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                <Wifi className="w-3.5 h-3.5 animate-pulse" /> Live Hardware Stand Mockup
              </div>

              {/* Stand Theme Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setStandStyle('obsidian')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    standStyle === 'obsidian' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Onyx
                </button>
                <button
                  type="button"
                  onClick={() => setStandStyle('frosted')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    standStyle === 'frosted' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Acrylic
                </button>
                <button
                  type="button"
                  onClick={() => setStandStyle('brass')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    standStyle === 'brass' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Brass
                </button>
              </div>
            </div>

            {/* Realistic Table Stand Enclosure */}
            <div
              className={`rounded-2xl p-5 shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center space-y-3 ${
                standStyle === 'obsidian'
                  ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-800'
                  : standStyle === 'frosted'
                  ? 'bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 border border-slate-200'
                  : 'bg-gradient-to-b from-amber-950 via-stone-900 to-black text-amber-100 border border-amber-800/60'
              }`}
            >
              {/* Metallic Standoff Screws */}
              <div className="w-full flex items-center justify-between px-1">
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-500 shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-slate-600" />
                </div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-500 shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-slate-600" />
                </div>
              </div>

              {/* Brand & Badge */}
              <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                    T
                  </div>
                  <span className="text-xs font-black tracking-tight">tapyy</span>
                </div>
                <span className="text-[9px] font-mono bg-white/10 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                  {previewCode}
                </span>
              </div>

              {/* Venue & Placement Title */}
              <div className="space-y-0.5">
                <h3 className="text-sm font-black truncate max-w-[240px]">
                  {selectedBiz?.name || 'Select Business Tenant'}
                </h3>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-amber-400">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{cardName || 'Counter Stand #1'}</span>
                </div>
              </div>

              {/* High-Contrast Stand QR Graphic */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-200 my-1">
                <QRCodeSVG value={previewUrl} size={110} level="M" />
              </div>

              {/* Callout */}
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                  <Wifi className="w-3 h-3 text-amber-400 rotate-90" />
                  Tap Phone or Scan QR
                </p>
                <p className="text-[9px] text-gray-400 font-mono">
                  tapyy.com/r/{previewCode.toLowerCase()}
                </p>
              </div>

              {/* Test Flow Link Directly from Mockup */}
              <div className="w-full pt-2 border-t border-white/10">
                <a
                  href={`/r/${previewCode}`}
                  target="_blank"
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" /> Test Tap Flow Simulator
                </a>
              </div>
            </div>
          </div>

          {/* Issue Card Form */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 font-heading">
                <Plus className="w-5 h-5 text-emerald-600" /> Issue Physical Card
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase">
                Hardware Binding
              </span>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              {/* Tenant selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Business Tenant *</label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Placement label */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Card Placement / Label *</label>
                  <span className="text-[10px] text-gray-400">Physical Venue Spot</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Stand #1"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-black font-semibold"
                />

                {/* Categorized Quick Location Chips */}
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Quick Placement Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_LOCATION_CATEGORIES.flatMap((c) => c.items).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setCardName(loc)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 border ${
                          cardName === loc
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hardware Code & Random Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Custom Hardware Code (Optional)</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" /> Randomize
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. TAP-CTR01 (auto-generated if empty)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-black font-mono font-bold uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedBizId}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Issuing Card Stand...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Issue Physical Card
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Issued Cards Registry */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-heading">
                Hardware Registry ({filteredCards.length})
              </h2>
              <p className="text-xs text-gray-500">Live physical cards & NFC stands currently deployed.</p>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto overflow-x-auto max-w-full">
              {[
                { id: 'all', label: `All (${cards.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'inactive', label: `Inactive (${inactiveCount})` },
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
              placeholder="Search by code, placement label, or tenant business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Card Items List */}
          <div className="space-y-3.5">
            {filteredCards.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
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
                    className="p-4 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all shadow-xs space-y-3"
                  >
                    {/* Top Row: Identity & Badges */}
                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-start gap-3.5">
                        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex-shrink-0">
                          <QRCodeSVG id={`qr-svg-${card.id}`} value={url} size={54} level="M" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                              {card.card_code}
                            </span>
                            <strong className="text-sm font-extrabold text-gray-900 truncate">
                              {card.name}
                            </strong>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            Tenant:{' '}
                            <strong className="text-gray-900 font-bold">
                              {card.business?.name || 'Unassigned'}
                            </strong>
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                            {url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                            card.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              card.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          {card.status}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Action Toolbar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/80 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Copy Link */}
                        <button
                          onClick={() => copyCardUrl(card)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Copy NFC URL"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy NFC URL'}</span>
                        </button>

                        {/* Export Stand QR PNG Artwork */}
                        <button
                          onClick={() => downloadStandQR(card)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Export Print-Ready 800x1000 PNG Stand Artwork"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Stand Artwork</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Power status toggle */}
                        <button
                          onClick={() => handleToggleStatus(card)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            card.status === 'active'
                              ? 'bg-white hover:bg-amber-50 text-amber-600 border-gray-200'
                              : 'bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200'
                          }`}
                          title={card.status === 'active' ? 'Pause Stand' : 'Activate Stand'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Test Tap Flow */}
                        <a
                          href={`/r/${card.card_code}`}
                          target="_blank"
                          className="px-3 py-1.5 bg-slate-950 hover:bg-black text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                          title="Open Customer Review Tap Journey"
                        >
                          Test Flow <ExternalLink className="w-3 h-3" />
                        </a>

                        {/* Edit Modal */}
                        <button
                          onClick={() => openEditModal(card)}
                          className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                          title="Edit Card Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingCard(card)}
                          className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                          title="Purge Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* EDIT MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Hardware Record
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Business Tenant</label>
                <select
                  value={editBizId}
                  onChange={(e) => setEditBizId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Code</label>
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
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black font-bold capitalize text-gray-900 cursor-pointer"
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

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900 font-heading">Purge Hardware Record?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to purge card{' '}
                <strong className="text-gray-900 font-mono">{deletingCard.card_code}</strong> (
                {deletingCard.name})? Customers tapping this stand will encounter an unassigned error.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
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
                {isDeleting ? 'Purging...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
