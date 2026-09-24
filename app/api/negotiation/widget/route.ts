import { PLATFORM_ORIGIN, PILOT_PRODUCT, isPilotProduct } from '@/lib/negotiation/facts';

export const dynamic = 'force-dynamic';
export async function GET(request?: Request) {
  const productId = request ? new URL(request.url).searchParams.get("product") || PILOT_PRODUCT : PILOT_PRODUCT;
  if (!isPilotProduct(productId)) return new Response("", { status: 404 });
  const key = process.env.NEGOTIATION_PUBLIC_KEY;
  if (process.env.NEGOTIATION_WIDGET_ENABLED !== 'true' || !key || !/^[a-f0-9-]{36}$/i.test(key)) return new Response('', { status: 404 });
  // Same-origin host only; all authorization, copy, triggers and invitation
  // tokens belong to the unmodified EON widget and its embedded conversation.
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>EON private invitation</title><style>html,body{margin:0;background:transparent}</style></head><body>
<script>let last='';setInterval(()=>{const root=document.querySelector('[aria-label="Store negotiation"]')?.shadowRoot;const modal=root?.querySelector('[role="dialog"]');const card=root?.querySelector('section');const mode=modal&&!modal.hidden?'conversation':card&&!card.hidden?'invitation':'hidden';if(last!==mode){last=mode;parent.postMessage({eonWidgetMode:mode},location.origin)}},100);</script>
<script src="${PLATFORM_ORIGIN}/widget.js" data-workspace="${key}" data-product="${productId}" data-variant="${productId}:50ml" data-currency="INR" data-surface="product"></script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline' ${PLATFORM_ORIGIN}; connect-src ${PLATFORM_ORIGIN}; frame-src ${PLATFORM_ORIGIN}; style-src 'unsafe-inline'; frame-ancestors 'self'`,
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
}
