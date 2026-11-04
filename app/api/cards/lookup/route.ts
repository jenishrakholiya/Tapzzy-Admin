import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function cleanCardData(card: any) {
  if (!card) return card;
  const rawName = card.name || '';
  const isDeleted = rawName.startsWith('[DELETED');
  let cleanName = rawName;
  if (isDeleted) {
    const pipeMatch = rawName.match(/^\[DELETED\|([^|\]]+)(?:\|([^\]]+))?\]\s*(.*)$/);
    if (pipeMatch) {
      cleanName = (pipeMatch[3] || '').trim() || 'Stand';
    } else {
      const tagEnd = rawName.indexOf(']');
      cleanName = (tagEnd !== -1 ? rawName.slice(tagEnd + 1) : rawName.replace(/^\[DELETED\]\s*/, '')).trim() || 'Stand';
    }
  }
  return {
    ...card,
    name: cleanName,
    raw_name: rawName,
    is_deleted: isDeleted,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Card code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createAdminClient();

    const { data: card, error } = await supabase
      .from('cards')
      .select('*, business:businesses(*)')
      .ilike('card_code', cleanCode)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!card) {
      return NextResponse.json({ card: null, business: null }, { status: 404 });
    }

    if (typeof card.name === 'string' && card.name.startsWith('[DELETED')) {
      return NextResponse.json({ card: null, business: null }, { status: 404 });
    }

    return NextResponse.json({
      card: cleanCardData(card),
      business: card.business || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

