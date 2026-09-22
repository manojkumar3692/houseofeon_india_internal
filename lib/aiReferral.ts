// Observed attribution only. A direct visit or a generic Google referral
// cannot establish that someone saw an AI answer.
export function getAIReferralSource(referrer?: string, utmSource?: string): string | undefined {
  const sources: Record<string, string> = {
    "chatgpt.com": "chatgpt", "chat.openai.com": "chatgpt", "chatgpt": "chatgpt",
    "perplexity.ai": "perplexity", "perplexity": "perplexity",
    "claude.ai": "claude", "claude": "claude",
    "gemini.google.com": "gemini", "gemini": "gemini",
    "copilot.microsoft.com": "copilot", "copilot": "copilot",
    "grok.com": "grok", "grok": "grok",
  };
  const tagged = utmSource?.trim().toLowerCase();
  if (tagged && sources[tagged]) return sources[tagged];
  try {
    const host = new URL(referrer || "").hostname.toLowerCase().replace(/^www\./, "");
    return sources[host];
  } catch { return undefined; }
}
