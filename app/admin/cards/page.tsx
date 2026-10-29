'use client';

import React, { useState, useEffect } from 'react';
import { Business, PhysicalCard, CardStatus } from '@/lib/types';
import {
  getAllBusinesses,
  getAllCards,
  issuePhysicalCard,
  batchGenerateCards,
  resetCardToBatch,
  updateCard,
  deleteCard,
  restoreCard,
  hardDeleteCard,
  emptyTrash,
  restoreAllTrash,
} from '@/lib/data-service';
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
  Boxes,
  Printer,
  Sparkles,
  Link2,
  ShieldCheck,
  Layers,
  ArrowRight,
  RotateCcw,
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

  // Tab: 'active' | 'batch' | 'trash'
  const [activeTab, setActiveTab] = useState<'active' | 'batch' | 'trash'>('active');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [standStyle, setStandStyle] = useState<StandStyle>('obsidian');

  // Issue Card Form State (Single Active Card)
  const [selectedBizId, setSelectedBizId] = useState('');
  const [cardName, setCardName] = useState('Counter Stand #1');
  const [customCode, setCustomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch Generation State
  const [batchCount, setBatchCount] = useState<number>(10);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showPrintSheetModal, setShowPrintSheetModal] = useState(false);

  // Direct Assign Modal State (for Unassigned Cards)
  const [assignModalCard, setAssignModalCard] = useState<PhysicalCard | null>(null);
  const [assignBizId, setAssignBizId] = useState('');
  const [assignPlacement, setAssignPlacement] = useState('Counter Stand #1');
  const [isAssigning, setIsAssigning] = useState(false);

  // Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Card Modal State
  const [editingCard, setEditingCard] = useState<PhysicalCard | null>(null);
  const [editCardName, setEditCardName] = useState('');
  const [editCardCode, setEditCardCode] = useState('');
  const [editBizId, setEditBizId] = useState('');
  const [editStatus, setEditStatus] = useState<CardStatus>('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Soft Delete Card Modal State
  const [deletingCard, setDeletingCard] = useState<PhysicalCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hard Delete Card Modal State (From Trash)
  const [hardDeletingCard, setHardDeletingCard] = useState<PhysicalCard | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [restoringCardId, setRestoringCardId] = useState<string | null>(null);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Clear / Reset Stand to Batch Modal State
  const [clearingCard, setClearingCard] = useState<PhysicalCard | null>(null);
  const [isClearing, setIsClearing] = useState(false);

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
        setAssignBizId(bizList[0].id);
      }
    } catch (err) {
      console.error('Error loading card data:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedBiz = businesses.find((b) => b.id === selectedBizId);

  // Split cards: Active (assigned to a business) vs Batch Inventory (unassigned) vs Trash (soft deleted)
  const assignedCards = cards.filter((c) => !c.is_deleted && c.status !== 'unassigned');
  const unassignedCards = cards.filter((c) => !c.is_deleted && c.status === 'unassigned');
  const deletedCards = cards.filter((c) => !!c.is_deleted);

  function generateRandomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'TAP-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCode(code);
  }

  // Issue single stand directly for a business
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
      setCardName('Table Stand #' + (assignedCards.length + 1));
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

  // Generate batch of 10 blank unassigned cards
  async function handleGenerateBatch(countToGen: number = batchCount) {
    setIsGeneratingBatch(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const newBatch = await batchGenerateCards(countToGen);
      setMessage(`⚡ Generated ${newBatch.length} blank unassigned stands! Pre-print and stock them in your office.`);
      await loadData();
      setActiveTab('batch');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to generate batch cards.';
      setErrorMsg(msg);
    } finally {
      setIsGeneratingBatch(false);
    }
  }

  // Direct assign from admin panel (links unassigned card to business and moves it to active)
  function openAssignModal(card: PhysicalCard) {
    setAssignModalCard(card);
    setAssignPlacement(card.name && !card.name.startsWith('Blank Stand') ? card.name : 'Counter Stand #1');
    if (businesses.length > 0 && !assignBizId) {
      setAssignBizId(businesses[0].id);
    }
  }

  async function handleDirectAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignModalCard || !assignBizId) return;

    setIsAssigning(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const targetBiz = businesses.find((b) => b.id === assignBizId);
      await updateCard(assignModalCard.id, {
        business_id: assignBizId,
        name: assignPlacement.trim() || 'Counter Stand #1',
        status: 'active',
      });

      setMessage(
        `Stand "${assignModalCard.card_code}" linked to ${targetBiz?.name || 'business'} and moved to Active Stands!`
      );
      setAssignModalCard(null);
      await loadData();
      setActiveTab('active');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to assign stand.';
      setErrorMsg(msg);
    } finally {
      setIsAssigning(false);
    }
  }

  function openEditModal(card: PhysicalCard) {
    setEditingCard(card);
    setEditCardName(card.name);
    setEditCardCode(card.card_code);
    setEditBizId(card.business_id || (businesses[0]?.id || ''));
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
        business_id: editBizId || null,
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
      setMessage(`Moved stand "${deletingCard.card_code}" to Trash. You can easily restore it anytime from the Trash tab.`);
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

  async function handleRestoreCard(card: PhysicalCard) {
    setRestoringCardId(card.id);
    setErrorMsg(null);
    try {
      await restoreCard(card.id);
      setMessage(`♻️ Successfully restored stand "${card.card_code}"! It is now back in your active inventory.`);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to restore stand.';
      setErrorMsg(msg);
    } finally {
      setRestoringCardId(null);
    }
  }

  async function handleHardDeleteConfirm() {
    if (!hardDeletingCard) return;
    setIsHardDeleting(true);
    setErrorMsg(null);
    try {
      await hardDeleteCard(hardDeletingCard.id);
      setMessage(`Stand "${hardDeletingCard.card_code}" has been permanently purged from database.`);
      setHardDeletingCard(null);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to permanently erase stand.';
      setErrorMsg(msg);
    } finally {
      setIsHardDeleting(false);
    }
  }

  async function handleRestoreAll() {
    setErrorMsg(null);
    try {
      const count = await restoreAllTrash();
      setMessage(`♻️ Restored ${count} stand${count === 1 ? '' : 's'} from Trash!`);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to restore stands.';
      setErrorMsg(msg);
    }
  }

  async function handleEmptyTrashConfirm() {
    setIsEmptyingTrash(true);
    setErrorMsg(null);
    try {
      await emptyTrash();
      setMessage(`Permanently emptied all stands from Trash.`);
      setShowEmptyTrashModal(false);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to empty trash.';
      setErrorMsg(msg);
    } finally {
      setIsEmptyingTrash(false);
    }
  }

  async function handleClearConfirm() {
    if (!clearingCard) return;
    setIsClearing(true);
    setErrorMsg(null);

    try {
      await resetCardToBatch(clearingCard.id);
      setMessage(
        `Stand "${clearingCard.card_code}" cleared and returned to Batch Inventory as a fresh unassigned QR stand!`
      );
      setClearingCard(null);
      await loadData();
      setActiveTab('batch');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to clear stand.';
      setErrorMsg(msg);
    } finally {
      setIsClearing(false);
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

  // Clean, High-Resolution QR + Serial Code Exporter (Optimized for Physical Stand & Small Print)
  function downloadStandQR(card: PhysicalCard) {
    const canvasWidth = 600;
    const canvasHeight = 700;
    const qrSize = 500;
    const qrX = (canvasWidth - qrSize) / 2; // 50px
    const qrY = 40; // 40px top padding (safe quiet zone)

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crisp pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const svgElement = document.getElementById(`qr-svg-${card.id}`);
    if (svgElement) {
      let xml = new XMLSerializer().serializeToString(svgElement);
      // Ensure vector scaling at high resolution
      xml = xml
        .replace(/width="[^"]+"/, `width="${qrSize}"`)
        .replace(/height="[^"]+"/, `height="${qrSize}"`);
      if (!xml.includes('xmlns=')) {
        xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const image64 = `data:image/svg+xml;base64,${svg64}`;

      const img = new Image();
      img.onload = () => {
        // Draw the QR code with sharp pixel clarity
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Stand Serial Code: Bold, large, high-contrast black for small print visibility
        let fontSize = 52;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace`;

        // Proportionally scale if text ever exceeds the QR width
        while (ctx.measureText(card.card_code).width > (qrSize - 10) && fontSize > 24) {
          fontSize -= 2;
          ctx.font = `900 ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace`;
        }

        const textY = qrY + qrSize + Math.round((canvasHeight - (qrY + qrSize)) / 2);
        ctx.fillText(card.card_code, canvasWidth / 2, textY);

        const a = document.createElement('a');
        a.download = `QR-${card.card_code}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = image64;
    }
  }

  // Active tab filter
  const activeCount = assignedCards.filter((c) => c.status === 'active').length;
  const inactiveCount = assignedCards.filter((c) => c.status === 'inactive').length;

  const filteredAssignedCards = assignedCards.filter((card) => {
    const matchesSearch =
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.business?.name && card.business.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUnassignedCards = unassignedCards.filter((card) =>
    card.card_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeletedCards = deletedCards.filter((card) => {
    const matchesSearch =
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.business?.name && card.business.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const previewCode = customCode || 'TAP-PREVIEW';
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${previewCode}`
      : `https://tapyy.com/r/${previewCode}`;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
            Stands & Cards
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage blank pre-printed hardware inventory and active venue review stands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('active');
              setSearchQuery('');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Active Stands ({assignedCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('batch');
              setSearchQuery('');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-slate-950 text-amber-300 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Batch ({unassignedCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('trash');
              setSearchQuery('');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'trash'
                ? 'bg-red-50 text-red-700 shadow-xs border border-red-200'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Trash ({deletedCards.length})</span>
          </button>
        </div>

        {activeTab === 'batch' && unassignedCards.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPrintSheetModal(true)}
            className="w-full sm:w-auto justify-center px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Batch QR Sheet ({unassignedCards.length})</span>
          </button>
        )}

        {activeTab === 'trash' && deletedCards.length > 0 && (
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleRestoreAll}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore All</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEmptyTrashModal(true)}
              className="flex-1 sm:flex-initial justify-center px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
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
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: BATCH INVENTORY (UNASSIGNED PRE-PRINT CARDS)     */}
      {/* ======================================================== */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">Blank Stock</p>
                <p className="text-xl sm:text-2xl font-black text-amber-500 font-heading mt-0.5">
                  {unassignedCards.length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block">Ready to activate</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">Active Stands</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 font-heading mt-0.5">
                  {assignedCards.length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block">Live in venues</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">Total Fleet</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900 font-heading mt-0.5">
                  {cards.length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block">Total inventory</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Batch Generator Action Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] sm:text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span>Batch Pre-Printing Generator</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight font-heading text-white">
                  Generate Blank Cards & Stands
                </h2>
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                  Generates unassigned stands with unique serial codes and QR codes. Order them in bulk, keep in inventory, and scan-activate on-site.
                </p>
              </div>

              {/* Generator Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                <div className="grid grid-cols-4 sm:flex items-center gap-1 text-xs font-bold">
                  {[5, 10, 25, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setBatchCount(qty)}
                      className={`py-1.5 sm:px-3 text-center rounded-xl transition-all cursor-pointer ${
                        batchCount === qty
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'text-gray-400 hover:text-white bg-white/5 sm:bg-transparent'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateBatch(batchCount)}
                  disabled={isGeneratingBatch}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate {batchCount} Stands</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Unassigned Batch Grid */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-900 font-heading">
                  Blank Inventory Stands ({filteredUnassignedCards.length})
                </h3>
                <p className="text-xs text-gray-500">
                  When scanned with a phone, these stands open the mobile activation page to link a business.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stand code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
            </div>

            {filteredUnassignedCards.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-700">No blank stands in inventory</p>
                  <p className="text-xs text-gray-400">
                    Click "Generate 10 Stands" above to create your first batch of pre-printed cards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateBatch(10)}
                  disabled={isGeneratingBatch}
                  className="px-4 py-2 bg-slate-950 text-amber-300 rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer"
                >
                  ⚡ Generate 10 Blank Stands Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredUnassignedCards.map((card) => {
                  const url =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/r/${card.card_code}`
                      : `https://tapyy.com/r/${card.card_code}`;
                  const isCopied = copiedCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      className="p-4 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs bg-slate-950 text-amber-300 px-2 py-0.5 rounded-lg">
                            {card.card_code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                            Unassigned
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-xs flex-shrink-0">
                            <QRCodeSVG id={`qr-svg-${card.id}`} value={url} size={68} level="M" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">
                              {card.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{url}</p>
                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Ready for Print / NFC
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyCardUrl(card)}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadStandQR(card)}
                            className="p-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs cursor-pointer"
                            title="Download Print QR & Code"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          <a
                            href={`/r/${card.card_code}`}
                            target="_blank"
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-black text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all"
                            title="Test Scan & Activation"
                          >
                            <span>Scan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openAssignModal(card)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCard(card)}
                            className="p-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: ACTIVE STANDS (ASSIGNED VENUE HARDWARE)          */}
      {/* ======================================================== */}
      {activeTab === 'active' && (
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
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Test Flow
                </a>
              </div>
            </div>

            {/* Issue Stand Form */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
                <Plus className="w-4 h-4 text-emerald-600" /> Issue Active Stand
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
                Active Stands ({filteredAssignedCards.length})
              </h2>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                {[
                  { id: 'all', label: `All (${assignedCards.length})` },
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
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Cards List */}
            <div className="space-y-2.5">
              {filteredAssignedCards.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No active stands found.
                </div>
              ) : (
                filteredAssignedCards.map((card) => {
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
                      <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-gray-200/60 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => copyCardUrl(card)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => downloadStandQR(card)}
                            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Download Print QR & Code"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Print QR</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleToggleStatus(card)}
                            className="p-2 rounded-lg border bg-white hover:bg-gray-100 text-gray-600 border-gray-200 cursor-pointer"
                            title={card.status === 'active' ? 'Pause stand' : 'Activate stand'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/r/${card.card_code}`}
                            target="_blank"
                            className="px-2.5 py-1.5 bg-slate-950 text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-black transition-all"
                          >
                            Test <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          <button
                            onClick={() => openEditModal(card)}
                            className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 rounded-lg cursor-pointer"
                            title="Edit Stand"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setClearingCard(card)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Clear stand & return to Batch Inventory as a fresh unassigned QR"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Clear</span>
                          </button>

                          <button
                            onClick={() => setDeletingCard(card)}
                            className="p-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg cursor-pointer"
                            title="Delete Stand"
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
      )}

      {/* ======================================================== */}
      {/* VIEW 3: TRASH & ARCHIVED (SOFT DELETED) STANDS           */}
      {/* ======================================================== */}
      {activeTab === 'trash' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full tracking-wider">
                  Protected Soft Delete
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {deletedCards.length} {deletedCards.length === 1 ? 'stand' : 'stands'} in trash
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 font-heading">
                Trash & Recoverable Stands
              </h2>
              <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                Stands deleted by accident are never removed permanently. They are safely deactivated and stored here so you can easily restore them at any time with 1 click.
              </p>
            </div>

            {deletedCards.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore All ({deletedCards.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmptyTrashModal(true)}
                  className="flex-1 sm:flex-initial justify-center px-3 py-2.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Trash</span>
                </button>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deleted stands by serial, label, or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black"
              />
            </div>
            <span className="text-xs text-gray-400 font-semibold self-end sm:self-auto">
              Showing {filteredDeletedCards.length} of {deletedCards.length}
            </span>
          </div>

          {/* Empty state or Items grid */}
          {deletedCards.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900 font-heading">
                  Trash is Completely Clean
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No stands have been deleted. When you delete any active or batch stand, it will safely appear here instead of being permanently removed from your database.
                </p>
              </div>
            </div>
          ) : filteredDeletedCards.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-400">
              No deleted stands match &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDeletedCards.map((card) => {
                const isRestoring = restoringCardId === card.id;
                const formattedDate = card.deleted_at
                  ? new Date(card.deleted_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recently';

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl border border-red-100 bg-red-50/20 hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-sm text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            {card.card_code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            In Trash
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                          {card.name || 'Unnamed Stand'}
                        </p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{card.business?.name || 'Unassigned Batch Inventory'}</span>
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-gray-400 font-mono shrink-0">
                        <p>Deleted</p>
                        <p className="font-bold text-gray-600">{formattedDate}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreCard(card)}
                        disabled={isRestoring}
                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                        <span>{isRestoring ? 'Restoring...' : 'Restore Stand'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHardDeletingCard(card)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Permanently Delete (Cannot Undo)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DIRECT ASSIGN UNASSIGNED STAND TO A BUSINESS    */}
      {/* ======================================================== */}
      {assignModalCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Inventory Linking</span>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
                  <Link2 className="w-4 h-4 text-emerald-600" /> Link Stand {assignModalCard.card_code}
                </h3>
              </div>
              <button
                onClick={() => setAssignModalCard(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectAssign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Business Client</label>
                <select
                  value={assignBizId}
                  onChange={(e) => setAssignBizId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Placement / Stand Label</label>
                <input
                  type="text"
                  required
                  value={assignPlacement}
                  onChange={(e) => setAssignPlacement(e.target.value)}
                  placeholder="e.g. Counter Stand #1"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                />

                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setAssignPlacement(loc)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        assignPlacement === loc
                          ? 'bg-slate-900 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium leading-relaxed">
                Once linked, this stand will automatically move out of <strong>Batch Inventory</strong> and into{' '}
                <strong>Active Stands</strong>!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setAssignModalCard(null)}
                  className="flex-1 sm:flex-initial text-center px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignBizId}
                  className="flex-1 sm:flex-initial text-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? 'Linking...' : 'Link & Move to Active'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PRINT BATCH QR SHEET                           */}
      {/* ======================================================== */}
      {showPrintSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2 font-heading">
                  <Printer className="w-4 h-4 text-blue-600" /> Printable Batch QR Sheet
                </h3>
                <p className="text-xs text-gray-500">
                  Ready-to-cut serial QR codes for card manufacturers or desktop printing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>

                <button
                  onClick={() => setShowPrintSheetModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3">
              {unassignedCards.map((card) => {
                const url =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${card.card_code}`
                    : `https://tapyy.com/r/${card.card_code}`;

                return (
                  <div
                    key={card.id}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center text-center bg-white"
                  >
                    <div className="p-1 bg-white">
                      <QRCodeSVG value={url} size={110} level="M" />
                    </div>
                    <span className="font-mono font-black text-sm text-black tracking-wider mt-2">
                      {card.card_code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDIT ACTIVE STAND                               */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* MODAL 3: EDIT ACTIVE STAND                               */}
      {/* ======================================================== */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 font-heading">
                <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Edit Stand
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
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
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
                >
                  <option value="">-- No Business (Unassigned) --</option>
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
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black font-bold capitalize text-gray-900 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Paused</option>
                  <option value="unassigned">Unassigned (Batch Inventory)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="flex-1 sm:flex-initial text-center px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 sm:flex-initial text-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SOFT DELETE (MOVE TO TRASH) CONFIRMATION        */}
      {/* ======================================================== */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-fade-in text-center max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 font-heading">Move Stand to Trash?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Stand <strong className="font-mono text-gray-900">{deletingCard.card_code}</strong> will be soft-deleted and safely archived in your Trash.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 font-medium text-left space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span><strong>Not permanently deleted</strong> from database.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>Can be <strong>restored with 1 click</strong> anytime from Trash.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                className="px-3.5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: PERMANENT HARD DELETE CONFIRMATION              */}
      {/* ======================================================== */}
      {hardDeletingCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-fade-in text-center max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 font-heading">Permanently Erase Stand?</h3>
              <p className="text-xs text-red-600 font-semibold leading-relaxed">
                Stand <strong className="font-mono text-black">{hardDeletingCard.card_code}</strong> will be permanently wiped from the database.
              </p>
              <p className="text-[11px] text-gray-400">
                This action CANNOT be undone and this stand serial cannot be recovered.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHardDeletingCard(null)}
                className="px-3.5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl flex-1 cursor-pointer"
              >
                Keep in Trash
              </button>
              <button
                type="button"
                onClick={handleHardDeleteConfirm}
                disabled={isHardDeleting}
                className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isHardDeleting ? 'Erasing...' : 'Permanently Erase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: EMPTY TRASH CONFIRMATION                        */}
      {/* ======================================================== */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-fade-in text-center max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 font-heading">Permanently Empty Trash?</h3>
              <p className="text-xs text-red-600 font-semibold leading-relaxed">
                This will permanently delete all {deletedCards.length} stands currently in Trash from your database.
              </p>
              <p className="text-[11px] text-gray-400">
                None of these stands will be recoverable after this.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEmptyTrashModal(false)}
                className="px-3.5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyTrashConfirm}
                disabled={isEmptyingTrash}
                className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isEmptyingTrash ? 'Emptying...' : 'Empty Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CLEAR STAND & RETURN TO BATCH CONFIRMATION       */}
      {/* ======================================================== */}
      {clearingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-fade-in text-center max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 font-heading">
                Clear Stand & Reset to Batch?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This will unlink stand <strong className="font-mono text-gray-900">{clearingCard.card_code}</strong> from{' '}
                <strong className="text-gray-800">{clearingCard.business?.name || 'its business'}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 font-medium text-left space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Moves back to <strong>📦 Batch Inventory</strong>.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Status resets to <strong>Unassigned</strong>.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Next phone scan opens the <strong>Setup Page</strong> for a new client!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setClearingCard(null)}
                className="px-3.5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearConfirm}
                disabled={isClearing}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex-1 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isClearing ? 'Clearing...' : 'Clear Stand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
