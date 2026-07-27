"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function getProductionHostname() {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "";
  }
}

/**
 * Loads GA + Meta Pixel only when the page is actually being viewed on the
 * real production domain (NEXT_PUBLIC_SITE_URL). This stops local dev
 * (localhost), preview/staging deployments, and any other non-production
 * host from ever reporting PageView/AddToCart/Purchase/etc. to the live
 * analytics accounts.
 *
 * The hostname check runs client-side only (after mount) so the server-
 * rendered HTML and the first client render both output nothing, avoiding
 * a hydration mismatch — the scripts appear only after the effect confirms
 * the host matches.
 */
export default function AnalyticsScripts() {
  const [isProductionHost, setIsProductionHost] = useState(false);

  useEffect(() => {
    const productionHostname = getProductionHostname();

    setIsProductionHost(
      Boolean(productionHostname) &&
        window.location.hostname === productionHostname
    );
  }, []);

  if (!isProductionHost) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      ) : null}

      {metaPixelId ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
