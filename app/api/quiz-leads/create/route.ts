import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z
  .object({
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    genderAnswer: z.string().optional().or(z.literal("")),
    occasionAnswer: z.string().optional().or(z.literal("")),
    moodAnswer: z.string().optional().or(z.literal("")),
    recommendedProductId: z.string().optional().or(z.literal("")),
    recommendedProductName: z.string().optional().or(z.literal("")),
    couponCode: z.string().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: "Phone or email is required",
  });

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("quiz_leads").insert({
      phone: payload.phone || null,
      email: payload.email || null,

      gender_answer: payload.genderAnswer || null,
      occasion_answer: payload.occasionAnswer || null,
      mood_answer: payload.moodAnswer || null,

      recommended_product_id: payload.recommendedProductId || null,
      recommended_product_name: payload.recommendedProductName || null,
      coupon_code: payload.couponCode || "EON20",
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("quiz lead save failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save your details",
      },
      { status: 400 }
    );
  }
}
