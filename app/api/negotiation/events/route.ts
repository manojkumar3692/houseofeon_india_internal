import { timingSafeEqual } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendConnectorEvent } from '@/lib/negotiation/vendor/handler.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Invoke from an authenticated external scheduler; never from a browser or
// payment-success redirect. Durable event IDs make retries safe at the platform.
export async function POST(request: Request) {
  const token = process.env.NEGOTIATION_EVENT_WORKER_SECRET;
  const installationId = process.env.NEGOTIATION_INSTALLATION_ID;
  const secret = process.env.NEGOTIATION_INSTALLATION_SECRET;
  const received = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${token}`);
  if (!token || token.length < 32 || !installationId || !secret || process.env.VERCEL_ENV !== 'preview' ||
      process.env.NEGOTIATION_CONNECTOR_ENABLED !== 'true' || received.length !== expected.length ||
      !timingSafeEqual(received, expected)) return new Response(null, { status: 403 });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('negotiation_event_outbox').select('*')
      .eq('installation_id', installationId).is('delivered_at', null).order('occurred_at').limit(5);
    if (error) throw error;
    for (const row of data || []) {
      await sendConnectorEvent({ platformOrigin: 'https://eon-negotiation.vercel.app', installationId, secret,
        event: { eventId: row.event_id, type: row.type, externalId: row.external_id,
          occurredAt: new Date(row.occurred_at).toISOString() } });
      const saved = await db.from('negotiation_event_outbox').update({ delivered_at: new Date().toISOString() })
        .eq('event_id', row.event_id).eq('installation_id', installationId);
      if (saved.error) throw saved.error;
    }
    return Response.json({ delivered: data?.length || 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Event delivery unavailable; retry' }, { status: 503 });
  }
}
