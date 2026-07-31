"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// Same hostname gate as components/AnalyticsScripts.tsx (GA/Meta) — hardcoded
// on purpose rather than read from NEXT_PUBLIC_SITE_URL, so no environment's
// config can accidentally satisfy it. Without this, Clarity recorded every
// local `npm run dev` session under the same live project as real visitors.
const PRODUCTION_HOSTNAME = "www.houseofeon.in";

export default function MicrosoftClarity() {
  const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;
  const [isProductionHost, setIsProductionHost] = useState(false);

  useEffect(() => {
    setIsProductionHost(window.location.hostname === PRODUCTION_HOSTNAME);
  }, []);

  if (!clarityId || !isProductionHost) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
}