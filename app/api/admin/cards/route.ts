import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*, business:businesses(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ cards: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { business_id, name, card_code, status } = await req.json();
    if (!business_id || !name) {
      return NextResponse.json({ error: 'business_id and card placement name are required' }, { status: 400 });
    }

    const code = card_code || `card-${Math.random().toString(36).substring(2, 7)}`;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('cards')
      .insert([{ business_id, card_code: code, name, status: status || 'active' }])
      .select('*, business:businesses(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ card: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, business_id, name, card_code, status } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Card ID is required for update' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (business_id !== undefined) updates.business_id = business_id;
    if (name !== undefined) updates.name = name;
    if (card_code !== undefined) updates.card_code = card_code;
    if (status !== undefined) updates.status = status;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select('*, business:businesses(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ card: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Card ID is required for deletion' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
