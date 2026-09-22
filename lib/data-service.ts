import { cache } from 'react';
import { Business, PhysicalCard, ReviewSession, AnalyticsEvent, AIGeneration } from './types';
import { createClient } from './supabase/client';
import { createAdminClient } from './supabase/admin';

const BIZ_STORAGE_KEY = 'tapyy_businesses_v2';
const CARDS_STORAGE_KEY = 'tapyy_cards_v2';
const REVIEWS_STORAGE_KEY = 'tapyy_reviews_v2';

const DEFAULT_SEED_REVIEWS: ReviewSession[] = [
  {
    id: 'rev-1',
    business_id: 'biz-seed-1',
    business_name: 'Artisan Espresso Lounge',
    card_id: 'card-seed-1',
    card_code: 'TAP-BAR01',
    rating: 5,
    feedback: 'Friendly barista and delicious oat milk flat white.',
    review_text: 'Outstanding 5-star experience at Artisan Espresso Lounge! Friendly barista and delicious oat milk flat white. Highly recommended!',
    google_clicked: true,
    completed: true,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'rev-2',
    business_id: 'biz-seed-1',
    business_name: 'Artisan Espresso Lounge',
    card_id: 'card-seed-2',
    card_code: 'TAP-CTR02',
    rating: 5,
    feedback: 'Super fast service and cozy atmosphere.',
    review_text: 'Loved my visit to Artisan Espresso Lounge. Super fast service and cozy atmosphere. Everything exceeded my expectations!',
    google_clicked: true,
    completed: true,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'rev-3',
    business_id: 'biz-seed-2',
    business_name: 'Grand Horizon Hotel',
    card_id: 'card-seed-3',
    card_code: 'TAP-REC01',
    rating: 4,
    feedback: 'Smooth check in, clean room, courteous concierge.',
    review_text: 'Really good experience at Grand Horizon Hotel. Smooth check in, clean room, courteous concierge. Will definitely stay again.',
    google_clicked: true,
    completed: true,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  }
];

function getStoredReviews(): ReviewSession[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_SEED_REVIEWS;
}

function saveStoredReviews(list: ReviewSession[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // fallback
    }
  }
}

function getStoredBusinesses(): Business[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(BIZ_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }
  return [];
}

function saveStoredBusinesses(list: Business[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // fallback
    }
  }
}

function getStoredCards(): PhysicalCard[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CARDS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }
  return [];
}

function saveStoredCards(list: PhysicalCard[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // fallback
    }
  }
}

function isLiveSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes('mock-tapyy') || !url.startsWith('https://')) {
    return false;
  }

  // Supabase JWT API keys always start with 'eyJ'
  const hasValidAnonKey = Boolean(
    anonKey &&
    !anonKey.startsWith('mock-') &&
    !anonKey.startsWith('sb_publishable_') &&
    anonKey.startsWith('eyJ')
  );

  const hasValidServiceKey = Boolean(
    serviceKey &&
    !serviceKey.startsWith('mock-') &&
    serviceKey.startsWith('eyJ')
  );

  return hasValidAnonKey || hasValidServiceKey;
}

function isApiKeyOrAuthError(errMessage?: string): boolean {
  if (!errMessage) return false;
  const msg = errMessage.toLowerCase();
  return (
    msg.includes('invalid api key') ||
    msg.includes('api key') ||
    msg.includes('jwt') ||
    msg.includes('unauthorized') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('invalid claim') ||
    msg.includes('apikey')
  );
}

export const getCardByCode = cache(async (cardCode: string): Promise<{ card: PhysicalCard; business: Business } | null> => {
  if (isLiveSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      const { data: card, error: cardErr } = await adminClient
        .from('cards')
        .select('*, business:businesses(*)')
        .eq('card_code', cardCode)
        .maybeSingle();

      if (!cardErr && card && card.business) {
        return { card, business: card.business };
      }
    } catch {
      // Fallback
    }

    try {
      const supabase = createClient();
      const { data: card, error: cardErr } = await supabase
        .from('cards')
        .select('*, business:businesses(*)')
        .eq('card_code', cardCode)
        .maybeSingle();

      if (!cardErr && card && card.business) {
        return { card, business: card.business };
      }
    } catch {
      // Fallback
    }
  }

  const cards = getStoredCards();
  const card = cards.find((c) => c.card_code === cardCode);
  if (!card) return null;
  const businesses = getStoredBusinesses();
  const business = businesses.find((b) => b.id === card.business_id) || card.business;
  if (!business) return null;
  return { card, business };
});

export async function getAllBusinesses(): Promise<Business[]> {
  if (isLiveSupabaseConfigured()) {
    // 1. Try server-side API route (uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS)
    try {
      const res = await fetch('/api/admin/businesses', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.businesses)) {
        return json.businesses;
      }
    } catch {
      // Fallback
    }

    // 2. Direct browser client fallback
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
  }

  return getStoredBusinesses();
}

export async function getAllCards(): Promise<PhysicalCard[]> {
  if (isLiveSupabaseConfigured()) {
    // 1. Try server-side API route (uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS)
    try {
      const res = await fetch('/api/admin/cards', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.cards)) {
        return json.cards;
      }
    } catch {
      // Fallback
    }

    // 2. Direct browser client fallback
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .select('*, business:businesses(*)')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
  }

  return getStoredCards();
}

export async function createBusiness(name: string, logo_url: string, google_review_url: string): Promise<Business> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  if (isLiveSupabaseConfigured()) {
    // 1. Try server-side API route
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url, google_review_url }),
      });
      const json = await res.json();
      if (res.ok && json.business) {
        return json.business;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during business creation, using local fallback:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during business creation:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // 2. Direct browser client fallback
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('businesses')
        .insert([{ name, slug, logo_url, google_review_url, status: 'active' }])
        .select()
        .single();

      if (!error && data) return data;

      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during insert:', error.message);
        } else {
          console.error('Supabase error creating business:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const list = getStoredBusinesses();
  const newBiz: Business = {
    id: `biz-${Date.now()}`,
    name,
    slug,
    logo_url: logo_url || '🏢',
    google_review_url: google_review_url || 'https://google.com',
    status: 'active',
    created_at: new Date().toISOString(),
  };
  list.unshift(newBiz);
  saveStoredBusinesses(list);
  return newBiz;
}

export async function issuePhysicalCard(business_id: string, card_name: string, custom_code?: string): Promise<PhysicalCard> {
  const cardsList = getStoredCards();
  const code = custom_code || `${cardsList.length + 1}-${Math.random().toString(36).substring(2, 7)}`;
  
  if (isLiveSupabaseConfigured()) {
    // 1. Try server-side API route
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id, name: card_name, card_code: code }),
      });
      const json = await res.json();
      if (res.ok && json.card) {
        return json.card;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during card issuance, using local fallback:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during card issuance:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // 2. Direct browser client
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .insert([{ business_id, card_code: code, name: card_name, status: 'active' }])
        .select('*, business:businesses(*)')
        .single();

      if (!error && data) return data;

      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during card insert:', error.message);
        } else {
          console.error('Supabase error issuing card:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const businesses = getStoredBusinesses();
  const business = businesses.find((b) => b.id === business_id);
  const newCard: PhysicalCard = {
    id: `card-${Date.now()}`,
    business_id,
    card_code: code,
    name: card_name,
    status: 'active',
    created_at: new Date().toISOString(),
    business,
  };
  cardsList.unshift(newCard);
  saveStoredCards(cardsList);
  return newCard;
}

export async function getReviewsForBusiness(business_id?: string): Promise<ReviewSession[]> {
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('review_sessions').select('*').order('created_at', { ascending: false });
      if (business_id) query = query.eq('business_id', business_id);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback
    }
  }

  const stored = getStoredReviews();
  if (business_id) {
    return stored.filter((r) => r.business_id === business_id);
  }
  return stored;
}

export async function recordEvent(event_type: string, business_id: string, card_id?: string, session_id?: string, metadata?: Record<string, unknown>) {
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('events').insert([{ event_type, business_id, card_id, session_id, metadata }]);
    } catch {
      // Ignore fallback
    }
  }
}

export async function createReviewSession(data: {
  business_id: string;
  card_id?: string;
  rating: number;
  feedback?: string;
  review_text?: string;
  google_clicked?: boolean;
  completed?: boolean;
}): Promise<void> {
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('review_sessions').insert([{
        business_id: data.business_id,
        card_id: data.card_id,
        rating: data.rating,
        feedback: data.feedback,
        review_text: data.review_text,
        google_clicked: data.google_clicked ?? false,
        completed: data.completed ?? false,
      }]);
    } catch (err) {
      console.warn('Failed to record review session in Supabase:', err);
    }
  }

  // Also record in local storage for instantaneous offline & mock reactivity
  const list = getStoredReviews();
  const businesses = getStoredBusinesses();
  const biz = businesses.find((b) => b.id === data.business_id);
  const cards = getStoredCards();
  const card = cards.find((c) => c.id === data.card_id);

  const newSession: ReviewSession = {
    id: `rev-${Date.now()}`,
    business_id: data.business_id,
    business_name: biz?.name,
    card_id: data.card_id,
    card_code: card?.card_code,
    rating: data.rating,
    feedback: data.feedback,
    review_text: data.review_text,
    google_clicked: data.google_clicked ?? false,
    completed: data.completed ?? false,
    created_at: new Date().toISOString(),
  };

  list.unshift(newSession);
  saveStoredReviews(list);
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
  if (isLiveSupabaseConfigured()) {
    // 1. Try API Route
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (res.ok && json.business) {
        return json.business;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during business update:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during business update:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // 2. Direct browser client fallback
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { ...updates };
      if (updates.name && !updates.slug) {
        payload.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during update:', error.message);
        } else {
          console.error('Supabase error updating business:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const list = getStoredBusinesses();
  const index = list.findIndex((b) => b.id === id);
  if (index !== -1) {
    const existing = list[index];
    const updatedName = updates.name !== undefined ? updates.name : existing.name;
    const slug = updates.slug || (updates.name ? updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : existing.slug);
    const updated: Business = {
      ...existing,
      ...updates,
      name: updatedName,
      slug,
    };
    list[index] = updated;
    saveStoredBusinesses(list);
    return updated;
  }

  throw new Error(`Business with ID ${id} not found.`);
}

export async function deleteBusiness(id: string): Promise<boolean> {
  if (isLiveSupabaseConfigured()) {
    // 1. Try API Route
    try {
      const res = await fetch(`/api/admin/businesses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return true;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during business delete:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during business delete:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // 2. Direct browser client
    try {
      const supabase = createClient();
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (!error) return true;

      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during delete:', error.message);
        } else {
          console.error('Supabase error deleting business:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const list = getStoredBusinesses();
  const index = list.findIndex((b) => b.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    saveStoredBusinesses(list);

    const cardsList = getStoredCards();
    for (let i = cardsList.length - 1; i >= 0; i--) {
      if (cardsList[i].business_id === id) {
        cardsList.splice(i, 1);
      }
    }
    saveStoredCards(cardsList);
    return true;
  }
  return false;
}

export async function updateCard(id: string, updates: Partial<PhysicalCard>): Promise<PhysicalCard> {
  if (isLiveSupabaseConfigured()) {
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (res.ok && json.card) {
        return json.card;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during card update:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during card update:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id)
        .select('*, business:businesses(*)')
        .single();

      if (!error && data) return data;
      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during card update:', error.message);
        } else {
          console.error('Supabase error updating card:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const cardsList = getStoredCards();
  const index = cardsList.findIndex((c) => c.id === id);
  if (index !== -1) {
    const existing = cardsList[index];
    const updated: PhysicalCard = {
      ...existing,
      ...updates,
    };
    if (updates.business_id) {
      const businesses = getStoredBusinesses();
      updated.business = businesses.find((b) => b.id === updates.business_id);
    }
    cardsList[index] = updated;
    saveStoredCards(cardsList);
    return updated;
  }

  throw new Error(`Card with ID ${id} not found.`);
}

export async function deleteCard(id: string): Promise<boolean> {
  if (isLiveSupabaseConfigured()) {
    try {
      const res = await fetch(`/api/admin/cards?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return true;
      }
      if (json.error) {
        if (isApiKeyOrAuthError(json.error)) {
          console.warn('Supabase auth error during card delete:', json.error);
        } else if (!json.error.includes('RLS') && !json.error.includes('policy')) {
          throw new Error(json.error);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (isApiKeyOrAuthError(err.message)) {
          console.warn('API key error caught during card delete:', err.message);
        } else if (!err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (!error) return true;

      if (error) {
        if (isApiKeyOrAuthError(error.message)) {
          console.warn('Supabase anon key error during card delete:', error.message);
        } else {
          console.error('Supabase error deleting card:', error);
          throw new Error(`Database Error (${error.code || 'RLS'}): ${error.message}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && isApiKeyOrAuthError(err.message)) {
        console.warn('Browser client API key error:', err.message);
      } else if (err instanceof Error) {
        throw err;
      }
    }
  }

  const cardsList = getStoredCards();
  const index = cardsList.findIndex((c) => c.id === id);
  if (index !== -1) {
    cardsList.splice(index, 1);
    saveStoredCards(cardsList);
    return true;
  }
  return false;
}
