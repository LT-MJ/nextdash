import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { inventoryAdjustSchema } from "@/lib/ecommerce/validation";
import { adjustInventory } from "@/lib/ecommerce/inventory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.inventory");
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = inventoryAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await adjustInventory(id, parsed.data.delta, parsed.data.reason, session.user.id);
    return NextResponse.json({ inventoryItem: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to adjust inventory";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
