import { assertAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { identity } from '@/lib/negotiation/security';
import { deliverEvents, reconcile } from '@/lib/negotiation/payments';

// Recovery worker: existing backend scheduler/admin credential only.
export async function POST(request: Request) {
  try { assertAdmin(request); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const db = getSupabaseAdmin(), installation = identity().installationId;
    const { data: events, error } = await db.from('negotiation_outbox').select('checkout_id')
      .eq('installation_id', installation).is('delivered_at', null).order('occurred_at').limit(30);
    if (error) throw error;
    let failed = 0;
    for (const id of new Set((events || []).map(e => e.checkout_id))) {
      try { await deliverEvents(id); } catch { failed++; }
    }
    const { data: pending, error: pendingError } = await db.from('negotiation_checkouts').select('id')
      .eq('installation_id', installation).in('state', ['pending', 'paid']).order('last_reconciled_at').limit(20);
    if (pendingError) throw pendingError;
    for (const row of pending || []) { try { await reconcile(row.id); } catch { failed++; } }
    return Response.json({ ok: failed === 0, failed }, { status: failed ? 503 : 200 });
  } catch { return Response.json({ error: 'Recovery unavailable' }, { status: 503 }); }
}
