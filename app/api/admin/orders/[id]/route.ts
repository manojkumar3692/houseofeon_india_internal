import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  shipping_status: z.enum(["pending", "packed", "shipped", "delivered", "cancelled"]).optional(),
  tracking_url: z.string().url().optional().or(z.literal("")),
  cod_balance_status: z.enum(["not_applicable", "pending", "collected"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const update: Record<string, unknown> = {};
    if (payload.shipping_status !== undefined) update.shipping_status = payload.shipping_status;
    if (payload.tracking_url !== undefined) update.tracking_url = payload.tracking_url || null;
    if (payload.cod_balance_status !== undefined) update.cod_balance_status = payload.cod_balance_status;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 400 });
  }
}
