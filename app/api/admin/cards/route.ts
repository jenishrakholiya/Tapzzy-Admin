import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
    const cardStatus = status || (business_id ? 'active' : 'unassigned');

    if (cardStatus !== 'unassigned' && (!business_id || !name)) {
      return NextResponse.json({ error: 'business_id and card placement name are required for active stands' }, { status: 400 });
    }

    const code = card_code || `TAP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const cardName = name || 'Blank Stand';
    const supabase = createAdminClient();

    const insertPayload: Record<string, unknown> = {
      card_code: code,
      name: cardName,
      status: cardStatus,
    };
    if (business_id) {
      insertPayload.business_id = business_id;
    }

    const { data, error } = await supabase
      .from('cards')
      .insert([insertPayload])
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

function decodeSoftDeleteInfo(rawName: string, businessId?: string | null): {
  cleanName: string;
  prevStatus: 'active' | 'inactive' | 'unassigned';
  deletedAt?: string;
} {
  const fallbackStatus: 'active' | 'unassigned' = businessId ? 'active' : 'unassigned';
  if (!rawName || !rawName.startsWith('[DELETED')) {
    return { cleanName: rawName || 'Stand', prevStatus: fallbackStatus };
  }

  // 1. Pipe-delimited: [DELETED|status|isoDate] name or [DELETED|status] name
  const pipeMatch = rawName.match(/^\[DELETED\|([^|\]]+)(?:\|([^\]]+))?\]\s*(.*)$/);
  if (pipeMatch) {
    const p1 = pipeMatch[1];
    const p2 = pipeMatch[2];
    const rest = (pipeMatch[3] || '').trim();

    let prevStatus: 'active' | 'inactive' | 'unassigned' = fallbackStatus;
    let deletedAt: string | undefined = undefined;

    if (p1 === 'active' || p1 === 'unassigned' || p1 === 'inactive') {
      prevStatus = (p1 === 'inactive' && businessId ? 'active' : p1) as 'active' | 'inactive' | 'unassigned';
      deletedAt = p2;
    } else if (p2 === 'active' || p2 === 'unassigned' || p2 === 'inactive') {
      prevStatus = (p2 === 'inactive' && businessId ? 'active' : p2) as 'active' | 'inactive' | 'unassigned';
      deletedAt = p1;
    } else {
      deletedAt = p1;
    }

    return {
      cleanName: rest || 'Stand',
      prevStatus,
      deletedAt,
    };
  }

  // 2. Colon-delimited or plain [DELETED] fallback
  const tagEnd = rawName.indexOf(']');
  const clean = (tagEnd !== -1 ? rawName.slice(tagEnd + 1) : rawName.replace(/^\[DELETED\]\s*/, '')).trim();

  let prevStatus: 'active' | 'inactive' | 'unassigned' = fallbackStatus;
  const insideTag = tagEnd !== -1 ? rawName.slice(0, tagEnd) : '';
  if (insideTag.includes('unassigned')) {
    prevStatus = 'unassigned';
  } else if (insideTag.includes('active')) {
    prevStatus = 'active';
  }

  return {
    cleanName: clean || 'Stand',
    prevStatus,
  };
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, business_id, name, card_code, status } = body;
    const supabase = createAdminClient();

    // 1. Restore a single soft-deleted card
    if (action === 'restore') {
      if (!id) {
        return NextResponse.json({ error: 'Card ID is required to restore' }, { status: 400 });
      }

      const { data: existingCard, error: fetchErr } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !existingCard) {
        return NextResponse.json({ error: fetchErr?.message || 'Card not found' }, { status: 404 });
      }

      const { cleanName, prevStatus } = decodeSoftDeleteInfo(existingCard.name, existingCard.business_id);

      const { data: restored, error: updateErr } = await supabase
        .from('cards')
        .update({
          name: cleanName,
          status: prevStatus,
        })
        .eq('id', id)
        .select('*, business:businesses(*)')
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, card: restored });
    }

    // 2. Restore all soft-deleted cards
    if (action === 'restore_all') {
      const { data: deletedCards, error: fetchErr } = await supabase
        .from('cards')
        .select('*')
        .like('name', '[DELETED%');

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 400 });
      }

      let restoredCount = 0;
      for (const card of deletedCards || []) {
        const { cleanName, prevStatus } = decodeSoftDeleteInfo(card.name, card.business_id);

        const { error: updateErr } = await supabase
          .from('cards')
          .update({ name: cleanName, status: prevStatus })
          .eq('id', card.id);

        if (!updateErr) restoredCount++;
      }

      return NextResponse.json({ success: true, count: restoredCount });
    }

    // 3. Permanently empty trash (hard-delete all soft-deleted cards)
    if (action === 'empty_trash') {
      const { error: delErr } = await supabase
        .from('cards')
        .delete()
        .like('name', '[DELETED%');

      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Standard card update
    if (!id) {
      return NextResponse.json({ error: 'Card ID is required for update' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (business_id !== undefined) updates.business_id = business_id;
    if (name !== undefined) updates.name = name;
    if (card_code !== undefined) updates.card_code = card_code;
    if (status !== undefined) updates.status = status;

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
    const isHard = searchParams.get('hard') === 'true';

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

    // 1. Permanent hard delete requested explicitly
    if (isHard) {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, id, mode: 'hard' });
    }

    // 2. Soft delete (Default safety behavior)
    const { data: existingCard, error: fetchErr } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existingCard) {
      return NextResponse.json({ error: fetchErr?.message || 'Card not found' }, { status: 404 });
    }

    const { cleanName } = decodeSoftDeleteInfo(existingCard.name, existingCard.business_id);
    const validStatus = (['active', 'inactive', 'unassigned'].includes(existingCard.status)
      ? existingCard.status
      : (existingCard.business_id ? 'active' : 'unassigned')) as 'active' | 'inactive' | 'unassigned';

    // Store in pipe-delimited format: [DELETED|status|timestamp] Name
    const softDeleteTag = `[DELETED|${validStatus}|${new Date().toISOString()}] ${cleanName}`;

    const { error: updateErr } = await supabase
      .from('cards')
      .update({
        name: softDeleteTag,
        status: 'inactive',
      })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id, mode: 'soft' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
