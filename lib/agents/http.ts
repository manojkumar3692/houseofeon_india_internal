import { SITE_URL } from "@/lib/seo";

const MAX_BODY = 8192;
const buckets = new Map<string, { count: number; expires: number }>();
export class AgentHttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function checkAgentRequest(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([SITE_URL, "https://houseofeon.in", ...(process.env.AGENT_ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean)]);
  if (origin && !allowed.has(origin)) throw new AgentHttpError(403, "Origin not allowed.");
  // Best-effort per-instance protection only; enforce shared limits at the CDN
  // for production traffic. The edge must overwrite forwarded IP headers.
  const key = (request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 100);
  const now = Date.now();
  for (const [id, value] of buckets) if (value.expires <= now) buckets.delete(id);
  const bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 5000) throw new AgentHttpError(429, "Please retry later.");
    buckets.set(key, { count: 1, expires: now + 60000 });
  } else if (++bucket.count > 60) throw new AgentHttpError(429, "Please retry later.");
}
export async function readAgentBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new AgentHttpError(415, "Use application/json.");
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) throw new AgentHttpError(413, "Request too large.");
  if (!request.body) throw new AgentHttpError(400, "JSON body required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BODY) { await reader.cancel(); throw new AgentHttpError(413, "Request too large."); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(body)); }
    catch { throw new AgentHttpError(400, "Invalid JSON."); }
  } finally { reader.releaseLock(); }
}
export function agentHeaders(request?: Request): Record<string, string> {
  return { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    ...(request?.headers.get("origin") ? { "Access-Control-Allow-Origin": request.headers.get("origin")!, Vary: "Origin" } : {}) };
}
export function httpFailure(error: unknown) {
  const status = error instanceof AgentHttpError ? error.status : 500;
  return Response.json({ error: status === 500 ? "Service temporarily unavailable." : (error as Error).message }, {
    status, headers: { ...agentHeaders(), ...(status === 429 ? { "Retry-After": "60" } : {}) },
  });
}
export function agentOptions(request: Request) {
  try {
    checkAgentRequest(request);
    return new Response(null, { status: 204, headers: { ...agentHeaders(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, MCP-Method, MCP-Name",
    } });
  } catch (error) { return httpFailure(error); }
}
