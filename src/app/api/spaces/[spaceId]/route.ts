import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";
import { spaceRowToApi, canvasRowToApi } from "@/lib/supabase-types";

/** GET /api/spaces/[spaceId] — single space with its canvases */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;

    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error || !space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const { data: canvases, error: canvasError } = await supabase
      .from('canvases')
      .select('*')
      .eq('space_id', spaceId)
      .order('order', { ascending: true });

    if (canvasError) throw canvasError;

    return NextResponse.json({
      ...spaceRowToApi(space),
      canvases: (canvases || []).map(canvasRowToApi),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('API /api/spaces/[spaceId] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH /api/spaces/[spaceId] — update space fields (e.g. name) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    const { data, error } = await supabase
      .from('spaces')
      .update(updates)
      .eq('id', spaceId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json(spaceRowToApi(data));
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('API /api/spaces/[spaceId] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
