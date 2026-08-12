import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAssistantSystemPrompt } from "@/lib/assistantContext";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  // Which product page the widget was opened on, if any — lets the
  // assistant bias its answers toward what the customer is looking at.
  productSlug: z.string().optional(),
});

// Best-effort in-memory rate limit — 20 messages / 10 minutes per IP. This
// is NOT a robust distributed limiter: on serverless hosting (Vercel etc.)
// each invocation can land on a fresh instance with empty memory, so a
// determined abuser could still get around it. It's here purely to blunt
// accidental loops (e.g. a bug causing a retry storm) and casual abuse,
// not to replace a real shared-store limiter (e.g. a Supabase table) if
// this ever needs hardening before a big ad push.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "The assistant isn't set up yet — try WhatsApp support instead." },
        { status: 500 }
      );
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages — give it a moment and try again." },
        { status: 429 }
      );
    }

    const payload = schema.parse(await request.json());

    // Defense in depth — the widget itself already caps history length
    // before sending, but never trust the client alone.
    const recentMessages = payload.messages.slice(-12);
    const systemPrompt = buildAssistantSystemPrompt(payload.productSlug);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
        temperature: 0.5,
        // Replies are meant to be short chat/voice turns, not essays — this
        // also bounds worst-case cost per message on top of the rate limit.
        max_tokens: 200,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("OpenAI request failed:", data);
      throw new Error("The assistant is temporarily unavailable.");
    }

    const rawReply = data?.choices?.[0]?.message?.content?.trim();
    if (!rawReply) throw new Error("The assistant is temporarily unavailable.");

    // The system prompt instructs the model to prefix off-domain replies
    // with "OFF_TOPIC: " (see lib/assistantContext.ts, rule 6). Strip it
    // here and surface a flag so the widget can count strikes and cut the
    // customer over to WhatsApp after repeated off-topic attempts, without
    // needing a second classification call to figure that out.
    const offTopic = rawReply.startsWith("OFF_TOPIC:");
    const reply = offTopic ? rawReply.replace(/^OFF_TOPIC:\s*/, "") : rawReply;

    return NextResponse.json({ reply, offTopic });
  } catch (error) {
    console.error("assistant route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}
