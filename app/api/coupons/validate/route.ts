import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateCouponDiscount, normalizeCouponCode } from "@/lib/coupons";
import { resolveTrialCredit } from "@/lib/trialCredit";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
  hasBundleLine: z.boolean().optional(),
  // Only known once the customer's on the checkout page with a phone
  // entered — trial-credit codes (see lib/trialCredit.ts) can't be
  // previewed without it, since redemption is phone-matched. Without a
  // phone, this endpoint still validates normal static coupons fine.
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    let result = calculateCouponDiscount({
      code: payload.code,
      subtotal: payload.subtotal,
      hasBundleLine: payload.hasBundleLine,
    });

    // Static coupon list didn't match — try it as a trial-pack order
    // number instead (real DB-backed lookup, see lib/trialCredit.ts).
    if (!result.valid) {
      result = await resolveTrialCredit({
        code: payload.code,
        phone: payload.phone,
        subtotal: payload.subtotal,
        hasBundleLine: payload.hasBundleLine,
      });
    }

    if (!result.valid || !result.coupon) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || "Invalid coupon code",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: normalizeCouponCode(payload.code),
      label: result.coupon.label,
      discount: result.discount,
    });
  } catch {
    return NextResponse.json(
      {
        valid: false,
        error: "Unable to validate coupon",
      },
      { status: 400 }
    );
  }
}