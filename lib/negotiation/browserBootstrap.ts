// Runs before analytics on full page entry. Only public installation identity
// is embedded; access tokens arrive in fragments and stay in this tab.
export function fragmentBootstrap(publicKey: string | undefined) {
  const key = /^[a-f0-9-]{36}$/i.test(publicKey || '') ? publicKey : '';
  return `(()=>{try{const p=location.pathname,h=location.hash.slice(1);if(!h)return;const q=new URLSearchParams(h);if(['/products/arctic-wave-perfume','/products/rank-perfume'].includes(p)&&q.has('eonTest')&&${JSON.stringify(key)}){sessionStorage.setItem('eon-test:'+${JSON.stringify(key)},q.get('eonTest'));q.delete('eonTest');history.replaceState(null,'',p+location.search+(q.size?'#'+q:''));}else if(/^\\/checkout\\/negotiated\\/[a-f0-9-]{36}$/i.test(p)&&/^[A-Za-z0-9_-]{43}$/.test(h)){sessionStorage.setItem('eon-checkout:'+p.split('/').pop(),h);history.replaceState(null,'',p+location.search);}}catch{}})();`;
}
