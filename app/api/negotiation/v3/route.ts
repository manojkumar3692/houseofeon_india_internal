import { createConnectorHandler } from '@/lib/negotiation/vendor/handler.mjs';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listCatalog } from '@/lib/negotiation/readOnly';
import { connectorConfig } from '@/lib/negotiation/config';
import { getContext, createCheckout } from '@/lib/negotiation/checkout';
import { reconcile } from '@/lib/negotiation/payments';
import { checkoutEnabled } from '@/lib/negotiation/security';

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
    getContext, reconcile,
    requirements: ['Arctic Wave or RANK 50ml, one bottle, prepaid pilot only. Approve product cost, floor and delivery expense in EON. Private testers only.'],
    capabilities: async () => ({ businessModels: ['physical_goods'], catalog: true, inventory: true,
      // economics means signed context support, not knowledge/approval of cost.
      economics: true, sales: false, shipping: 'flat', checkout: checkoutEnabled(), reconciliation: true, events: true }),
    createCheckout,
    claimNonce: async (nonce, expires) => {
      const { data, error } = await getSupabaseAdmin().rpc('claim_negotiation_nonce', {
        p_installation_id: installationId, p_nonce: nonce, p_expires_at: expires.toISOString(),
      });
      if (error) throw new Error('Replay store unavailable');
      return data === true;
    },
  })(request);
}
