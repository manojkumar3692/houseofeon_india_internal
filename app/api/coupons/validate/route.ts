import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateCouponDiscount, normalizeCouponCode } from "@/lib/coupons";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    const result = calculateCouponDiscount({
      code: payload.code,
      subtotal: payload.subtotal,
    });

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