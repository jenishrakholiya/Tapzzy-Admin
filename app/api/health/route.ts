import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('mock') &&
    supabaseUrl.startsWith('https://')
  );

  let dbStatus = 'healthy (local memory storage)';
  let dbLatencyMs = 0;

  if (isSupabaseConfigured) {
    try {
      const dbStart = Date.now();
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true });

      dbLatencyMs = Date.now() - dbStart;
      if (!error) {
        dbStatus = 'connected (supabase)';
      } else {
        dbStatus = `warning: ${error.message}`;
      }
    } catch {
      dbStatus = 'fallback (supabase unreachable)';
    }
  }

  const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : null;
  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: 'ok',
      service: 'tapyy-saas',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'production',
      database: {
        type: isSupabaseConfigured ? 'supabase' : 'mock-memory',
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      latencyMs: totalLatencyMs,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

// Support HEAD requests for lightweight cron jobs / uptime bots (saves bandwidth)
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'X-Health-Status': 'ok',
    },
  });
}
