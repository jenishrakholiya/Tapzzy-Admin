import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { cards } = await req.json();
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Array of cards is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const rowsToInsert = cards.map((c) => ({
      card_code: c.card_code,
      name: c.name || 'Blank Stand',
      status: c.status || 'unassigned',
      business_id: c.business_id || null,
    }));

    const { data, error } = await supabase
      .from('cards')
      .insert(rowsToInsert)
      .select('*, business:businesses(*)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ cards: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
