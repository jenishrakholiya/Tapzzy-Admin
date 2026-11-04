import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { card_code, business_id, placement_name } = body;

    if (!card_code || !business_id) {
      return NextResponse.json(
        { error: 'card_code and business_id are required' },
        { status: 400 }
      );
    }

    const cleanCode = (card_code || '').trim().toUpperCase();
    const cleanPlacement = (placement_name || '').trim() || 'Counter Stand #1';
    const supabase = createAdminClient();

    // 1. Verify business exists
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json(
        { error: 'Selected business was not found' },
        { status: 404 }
      );
    }

    // 2. Find and update the card
    const { data: card, error: cardErr } = await supabase
      .from('cards')
      .update({
        business_id: business.id,
        name: cleanPlacement,
        status: 'active',
      })
      .ilike('card_code', cleanCode)
      .select('*, business:businesses(*)')
      .maybeSingle();

    if (cardErr) {
      return NextResponse.json({ error: cardErr.message }, { status: 400 });
    }

    if (!card) {
      // If card was not in database yet (e.g. mock generated), create it
      const { data: newCard, error: insertErr } = await supabase
        .from('cards')
        .insert([
          {
            card_code: cleanCode,
            name: cleanPlacement,
            business_id: business.id,
            status: 'active',
          },
        ])
        .select('*, business:businesses(*)')
        .single();

      if (insertErr || !newCard) {
        return NextResponse.json(
          { error: insertErr?.message || 'Failed to activate stand' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        card: newCard,
        business,
      });
    }

    return NextResponse.json({
      success: true,
      card,
      business,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error during activation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

