import { createConnectorHandler } from '@/lib/negotiation/vendor/handler.mjs';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listCatalog, unavailable } from '@/lib/negotiation/readOnly';
import { connectorConfig } from '@/lib/negotiation/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const config = connectorConfig(process.env);
  if (!config) {
    return Response.json({ error: 'Connector not configured or disabled' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const { workspaceId, installationId, secret } = config;
  return createConnectorHandler({
    workspaceId, installationId, secret, listCatalog,
    getContext: async () => unavailable(), reconcile: async () => unavailable(),
    requirements: ['Read-only connection: negotiated checkout is not available.'],
    capabilities: async () => ({ businessModels: ['physical_goods'], catalog: true, inventory: true,
      economics: false, sales: false, shipping: 'none', checkout: false, reconciliation: false, events: false }),
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
