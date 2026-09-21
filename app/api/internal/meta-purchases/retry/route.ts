import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { retryTrialMetaPurchases } from "@/lib/metaConversions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Configure an authenticated scheduler to GET this endpoint every five minutes.
// Never expose the service-role key or Meta token to the scheduler/browser.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduler not configured" }, { status: 503 });
  const actual = createHash("sha256").update(request.headers.get("authorization") || "").digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  if (!timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await retryTrialMetaPurchases(request.url);
    return NextResponse.json(result, { status: result.failed ? 503 : 200 });
  } catch {
    console.error("Meta purchase recovery worker unavailable");
    return NextResponse.json({ error: "Purchase tracking recovery unavailable" }, { status: 503 });
  }
}
