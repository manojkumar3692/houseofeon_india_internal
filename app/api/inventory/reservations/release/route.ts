import { NextResponse } from "next/server";
import { z } from "zod";
import { releaseInventoryReservation } from "@/lib/inventoryServer";

const schema = z.object({ reservationKey: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const { reservationKey } = schema.parse(await request.json());
    await releaseInventoryReservation(reservationKey);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid reservation" }, { status: 400 });
  }
}
