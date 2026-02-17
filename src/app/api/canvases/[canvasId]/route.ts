import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";
import { canvasRowToApi } from "@/lib/supabase-types";

/** GET /api/canvases/[canvasId] — single canvas metadata */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  try {
    await requireAuth();

    const { canvasId } = await params;

    const { data, error } = await supabase
      .from('canvases')
      .select('*')
      .eq('id', canvasId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    return NextResponse.json(canvasRowToApi(data));
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('API /api/canvases/[canvasId] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH /api/canvases/[canvasId] — update canvas fields (e.g. emoji) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  try {
    await requireAuth();

    const { canvasId } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (body.emoji !== undefined) {
      updates.emoji = body.emoji;
    }

    const { data, error } = await supabase
      .from('canvases')
      .update(updates)
      .eq('id', canvasId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    return NextResponse.json(canvasRowToApi(data));
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('API /api/canvases/[canvasId] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
