import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAssistantSystemPrompt, PageType } from "@/lib/assistantContext";
import {
  ASSISTANT_TOOLS,
  createDisplayAccumulator,
  executeAssistantTool,
} from "@/lib/assistantTools";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  // Generous on purpose: this cap has to cover the concierge's OWN past
  // replies too, since the widget round-trips full history back on every
  // turn (see components/PerfumeAssistant.tsx). A single reply with
  // max_tokens: 300 can land anywhere up to ~1500+ characters depending on
  // word length — 1000 was too tight and caused a real bug where a normal
  // reply would get rejected the moment it came back as history on the
  // next message, breaking the rest of that chat. Actual cost/abuse
  // protection still comes from the message-count cap below, the 12-
  // message history window, and the per-IP rate limit, not this length.
  content: z.string().min(1).max(4000),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  productSlug: z.string().optional(),
  pageType: z.enum(["home", "product", "cart", "scent-fix", "other"]).optional(),
  cartSummary: z
    .array(z.object({ productId: z.string(), quantity: z.number() }))
    .optional(),
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

// Belt-and-suspenders: the system prompt tells the model never to use
// markdown (this is a plain chat bubble, not a renderer), but prompts
// aren't 100% reliable — a model that reaches for **bold**/### headers/
// bullet dashes anyway would otherwise show those symbols literally to the
// customer. Strip the common cases server-side so a prompt slip can't leak
// into the UI.
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // ### Heading
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/__(.+?)__/g, "$1") // __bold__
    .replace(/^[-*•]\s+/gm, "") // - bullet / * bullet
    .replace(/^\d+\.\s+/gm, "") // 1. numbered list
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Bounds how many tool-call round-trips a single message can trigger — a
// compare-then-confirm flow needs 2-3, this leaves headroom without letting
// a confused model loop indefinitely and burn tokens.
const MAX_TOOL_ITERATIONS = 4;

async function callOpenAI(conversation: unknown[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: conversation,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
      temperature: 0.5,
      // Replies are meant to be short chat/voice turns, not essays — this
      // also bounds worst-case cost per call on top of the rate limit.
      max_tokens: 300,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("OpenAI request failed:", data);
    throw new Error("The concierge is temporarily unavailable.");
  }

  return data;
}

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "The concierge isn't set up yet — try WhatsApp support instead." },
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
    const recentMessages = payload.messages.slice(-12);
    const systemPrompt = buildAssistantSystemPrompt({
      currentProductSlug: payload.productSlug,
      pageType: (payload.pageType as PageType) || "other",
    });

    const display = createDisplayAccumulator();
    const conversation: any[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages,
    ];

    let rawReply = "";

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const data = await callOpenAI(conversation);
      const message = data?.choices?.[0]?.message;
      if (!message) throw new Error("The concierge is temporarily unavailable.");

      const toolCalls = message.tool_calls;

      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        conversation.push({
          role: "assistant",
          content: message.content || null,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(toolCall.function?.arguments || "{}");
          } catch {
            args = {};
          }

          const result = await executeAssistantTool(
            toolCall.function?.name,
            args,
            display,
            { cartSummary: payload.cartSummary }
          );

          conversation.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        continue;
      }

      rawReply = (message.content || "").trim();
      break;
    }

    if (!rawReply) throw new Error("The concierge is temporarily unavailable.");

    // The system prompt instructs the model to prefix off-domain replies
    // with "OFF_TOPIC: " (see lib/assistantContext.ts, rule 6). Strip it
    // here and surface a flag so the widget can count strikes and cut the
    // customer over to WhatsApp after repeated off-topic attempts, without
    // needing a second classification call to figure that out.
    const offTopic = rawReply.startsWith("OFF_TOPIC:");
    const reply = stripMarkdown(offTopic ? rawReply.replace(/^OFF_TOPIC:\s*/, "") : rawReply);

    return NextResponse.json({
      reply,
      offTopic,
      products: display.products,
      comparison: display.comparison,
      offer: display.offer,
      orderStatus: display.orderStatus,
      clientActions: display.clientActions,
    });
  } catch (error) {
    console.error("assistant route error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}
