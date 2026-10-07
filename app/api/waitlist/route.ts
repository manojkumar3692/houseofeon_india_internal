import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Resend } from "resend";

export const runtime = "nodejs";
const schema = z.object({
  product: z.literal("riva"),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  consent: z.literal(true),
  website: z.literal(""),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please join through the RIVA page." }, { status: 403 });
  }
  let raw;
  try {
    const body = await request.text();
    if (body.length > 2048) return NextResponse.json({ error: "Submission is too long." }, { status: 413 });
    raw = JSON.parse(body);
  } catch { return NextResponse.json({ error: "Please check your details and retry." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and agree to RIVA launch emails." }, { status: 400 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: "The waitlist is temporarily unavailable." }, { status: 503 });
  }
  const { email } = parsed.data;
  try {
    // Same normalized email and body share a provider key, including after a
    // timeout/retry. Resend deduplicates accepted requests for 24 hours.
    const key = createHash("sha256").update(`riva:${email}`).digest("hex");
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM,
      to: "orders@houseofeon.in",
      replyTo: email,
      subject: "RIVA waitlist — new signup",
      text: ["HOUSE OF EON — RIVA WAITLIST", "", `Email: ${email}`, "Product: RIVA (Women)", "Source: RIVA product page", "", "Customer agreed to receive RIVA launch emails and may ask to be removed.", "Waitlist only. No order, payment or bottle reservation."].join("\n"),
    }, { idempotencyKey: `riva-waitlist/${key}` });
    if (error || !data?.id) throw new Error("Email not accepted");
    return NextResponse.json({ ok: true });
  } catch {
    console.error("RIVA waitlist email failed");
    return NextResponse.json({ error: "We couldn’t save your signup. Please retry." }, { status: 502 });
  }
}
