import Script from 'next/script';

// Server-rendered gate; public widget data contains no installation secret.
export default function NegotiationStagingWidget({ productId }: { productId: string }) {
  const workspace = process.env.NEGOTIATION_WIDGET_WORKSPACE_KEY;
  if (process.env.VERCEL_ENV !== 'preview' || process.env.NEGOTIATION_WIDGET_ENABLED !== 'true' ||
      process.env.NEGOTIATION_STAGING_VERIFIED !== 'true' || !workspace ||
      productId !== process.env.NEGOTIATION_STAGING_PRODUCT_ID) return null;
  return <Script id="negotiation-staging-widget" strategy="afterInteractive"
    src="https://eon-negotiation.vercel.app/widget.js" data-workspace={workspace}
    data-product={productId} data-variant={`${productId}:50ml`} data-currency="INR"
    data-label="Test an offer" />;
}
