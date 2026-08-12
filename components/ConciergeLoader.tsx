"use client";

import dynamic from "next/dynamic";

// Keeps the concierge's JS (chat UI, cart wiring, speech APIs) out of the
// critical initial bundle — `ssr: false` means it isn't rendered on the
// server at all and is fetched as its own chunk on the client after
// hydration, rather than shipping with every page's first paint.
//
// This is a code-split, not a true "only load after the launcher is
// tapped" lazy load (the brief's stretch goal) — the whole widget still
// fetches shortly after the page becomes interactive rather than waiting
// for a click. Splitting the launcher itself from the panel/chat logic
// would get closer to that, but adds real complexity for a marginal gain
// once this chunk is already off the critical path.
const PerfumeAssistant = dynamic(() => import("@/components/PerfumeAssistant"), {
  ssr: false,
});

export default function ConciergeLoader() {
  return <PerfumeAssistant />;
}
