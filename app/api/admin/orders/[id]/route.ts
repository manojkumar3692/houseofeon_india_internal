import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  shipping_status: z.enum(["pending", "packed", "shipped", "delivered", "cancelled"]),
  tracking_url: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .update({ shipping_status: payload.shipping_status, tracking_url: payload.tracking_url || null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 400 });
  }
}
