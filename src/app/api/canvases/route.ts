import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";
import { canvasRowToApi } from "@/lib/supabase-types";

/** GET /api/canvases — list all canvases */
export async function GET() {
  const { data, error } = await supabase.from('canvases').select('*');
  if (error) {
    console.error('GET /api/canvases error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data || []).map(canvasRowToApi));
}

/** POST /api/canvases — create a new canvas, optionally in a space */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const { name, spaceId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const targetSpaceId = spaceId || "";

    const { data: maxRow } = await supabase
      .from('canvases')
      .select('order')
      .eq('space_id', targetSpaceId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const maxOrder = maxRow?.order ?? -1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('canvases')
      .insert({
        id: `canvas-${Date.now()}`,
        space_id: targetSpaceId,
        name,
        created_at: now,
        updated_at: now,
        order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(canvasRowToApi(data), { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('POST /api/canvases error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
