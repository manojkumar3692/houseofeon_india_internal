import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const line = (max: number) => z.string().trim().min(1).max(max).refine(v => !/[\r\n]/.test(v));
const schema = z.object({
  requestId: z.string().uuid(),
  name: line(100), company: line(160), email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^[+\d\s()-]{7,24}$/).refine(v => v.replace(/\D/g, "").length >= 7),
  quantity: z.coerce.number().int().min(1).max(100000),
  budget: z.enum(["Not decided", "Under ₹500", "₹500–₹1,000", "₹1,000–₹1,500", "Above ₹1,500"]),
  occasion: z.enum(["Employee appreciation", "Diwali & festive gifting", "Client gifting", "Welcome kits", "Events & other"]),
  delivery: line(200), date: z.iso.date().or(z.literal("")),
  branding: z.enum(["Explore the options", "Company message card", "Branded sleeve / packaging", "Standard Discovery Set"]),
  giftMessage: z.string().trim().max(140).optional(),
  fragrances: z.array(z.enum(["Desert Tonka", "Arctic Wave", "Zyrox", "RANK", "Silent Gold"])).length(3).refine(v => new Set(v).size === 3).optional(),
  message: z.string().trim().max(2000), website: z.string().max(200), consent: z.literal(true),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please submit through the gifting page." }, { status: 403 });
  }
  let raw;
  try {
    const body = await request.text();
    if (body.length > 12000) return NextResponse.json({ error: "Your enquiry is too long." }, { status: 413 });
    raw = JSON.parse(body);
  } catch { return NextResponse.json({ error: "Please check your enquiry and try again." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ error: "Please check all required fields and try again." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: "We couldn’t send your enquiry. Please email orders@houseofeon.in directly." }, { status: 503 });
  }
  const d = parsed.data;
  const text = ["HOUSE OF EON — CORPORATE GIFTING ENQUIRY", "", `Name: ${d.name}`, `Company: ${d.company}`, `Email: ${d.email}`, `Phone: ${d.phone}`, "", "Gift: Discovery Set (3 × 8ml)", `Quantity: ${d.quantity} gift sets`, `Budget per gift: ${d.budget}`, `Occasion: ${d.occasion}`, `Delivery locations: ${d.delivery}`, `Requested delivery date: ${d.date || "To discuss"}`, `Personalisation: ${d.branding}`, "", `Notes: ${d.message || "None"}`, `Gift card message: ${d.giftMessage || "Not requested"}`, `Requested fragrances: ${d.fragrances?.join(", ") || "To discuss"}`, "", "Customer agreed to be contacted about this enquiry.", `Reference: ${d.requestId}`].join("\n");
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM, to: "orders@houseofeon.in", replyTo: d.email,
      subject: `Corporate gifting enquiry · ${d.quantity} sets · ${d.company}`, text,
    }, { idempotencyKey: `corporate-gifting/${d.requestId}` });
    if (error || !data?.id) throw new Error("Email provider did not accept the enquiry");
    return NextResponse.json({ ok: true });
  } catch {
    console.error("Corporate gifting enquiry email failed");
    return NextResponse.json({ error: "We couldn’t send your enquiry. Please retry or email orders@houseofeon.in." }, { status: 502 });
  }
}
