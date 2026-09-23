import { createConnectorHandler } from '@/lib/negotiation/vendor/handler.mjs';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getContext, listCatalog, reconcile, unavailable } from '@/lib/negotiation/merchant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const workspaceId = process.env.NEGOTIATION_WORKSPACE_ID;
  const installationId = process.env.NEGOTIATION_INSTALLATION_ID;
  const secret = process.env.NEGOTIATION_INSTALLATION_SECRET;
  // There is deliberately no production enable path in this first rollout.
  if (process.env.VERCEL_ENV !== 'preview' || process.env.NEGOTIATION_CONNECTOR_ENABLED !== 'true' ||
      !workspaceId || !installationId || !secret || secret.length < 32) {
    return Response.json({ error: 'Connector unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return createConnectorHandler({
    workspaceId, installationId, secret, listCatalog, getContext, reconcile,
    capabilities: async () => ({ businessModels: ['physical_goods'], catalog: true, inventory: true,
      economics: true, sales: false, shipping: 'zone_table', checkout: false, reconciliation: true, events: true }),
    // The existing public checkout recomputes retail/bundle pricing. Never send
    // an approved quote there or claim an enforceable checkout until the shared
    // inventory transaction and Razorpay expiry/recovery path are verified.
    createCheckout: async () => unavailable(),
    claimNonce: async (nonce, expires) => {
      const { data, error } = await getSupabaseAdmin().rpc('claim_negotiation_nonce', {
        p_installation_id: installationId, p_nonce: nonce, p_expires_at: expires.toISOString(),
      });
      if (error) throw new Error('Replay store unavailable');
      return data === true;
    },
  })(request);
}
