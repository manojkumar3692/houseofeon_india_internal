'use client';
import { useEffect, useRef, useState } from 'react';

// The supplied widget has no SPA teardown API. Its same-origin frame gives it
// a page lifecycle: navigation destroys its timers, listeners and offer iframe.
// No trigger engine or invitation handling is duplicated here.
export default function EonPilotWidget({ publicKey, productId = "arctic-wave" }: { publicKey: string; productId?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState('');
  const [mode, setMode] = useState('hidden');
  useEffect(() => {
    try {
      const fragment = new URLSearchParams(location.hash.slice(1));
      const token = fragment.get('eonTest') || sessionStorage.getItem(`eon-test:${publicKey}`) || '';
      // Ordinary shoppers do not even load the widget in this pilot. EON still
      // validates tester token signature, product, settings version and expiry.
      if (!token) return;
      if (fragment.has('eonTest')) {
        sessionStorage.setItem(`eon-test:${publicKey}`, token);
        fragment.delete('eonTest');
        history.replaceState(null, '', location.pathname + location.search + (fragment.size ? `#${fragment}` : ''));
      }
      setSrc(`/api/negotiation/widget?product=${encodeURIComponent(productId)}#${new URLSearchParams({ eonTest: token })}`);
    } catch { /* No storage => no private pilot access. */ }
    function resize(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow ||
          !['hidden', 'invitation', 'conversation'].includes(event.data?.eonWidgetMode)) return;
      setMode(event.data.eonWidgetMode);
    }
    window.addEventListener('message', resize);
    return () => window.removeEventListener('message', resize);
  }, [publicKey, productId]);
  if (!src) return null;
  return <iframe ref={frame} src={src} title="House of EON private offer" referrerPolicy="no-referrer"
    style={{ position: 'fixed', border: 0, bottom: 0, right: 0, zIndex: 2147483645,
      width: mode === 'conversation' ? '100%' : 'min(350px, 100%)',
      height: mode === 'conversation' ? '100%' : 300,
      visibility: mode === 'hidden' ? 'hidden' : 'visible' }} />;
}
