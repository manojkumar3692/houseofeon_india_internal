import crypto from "crypto";
import { NextResponse } from "next/server";
import { runMetaConversionWorker } from "@/lib/metaConversions";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || secret.length !== supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMetaConversionWorker(25);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Meta conversion cron failed:", error);
    return NextResponse.json({ error: "Meta conversion worker failed" }, { status: 500 });
  }
}

