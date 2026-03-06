import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";
import { spaceRowToApi, canvasRowToApi, boardSectionRowToApi } from "@/lib/supabase-types";

/** GET /api/spaces/[spaceId] — single space with its canvases */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;

    let { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error || !space) {
      // Auto-create the space if it doesn't exist yet
      const now = new Date().toISOString();
      const defaultNames: Record<string, string> = {
        'space-insights': 'Insights',
      };
      const name = defaultNames[spaceId];
      if (!name) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
      }
      const { data: created, error: createError } = await supabase
        .from('spaces')
        .insert({ id: spaceId, name, description: '', created_at: now, updated_at: now, order: 9999 })
        .select()
        .single();
      if (createError || !created) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
      }
      space = created;
    }

    const { data: canvases, error: canvasError } = await supabase
      .from('canvases')
      .select('*')
      .eq('space_id', spaceId)
      .order('order', { ascending: true });

    if (canvasError) throw canvasError;

    // Fetch board sections for this space
    const { data: sections } = await supabase
      .from('board_sections')
      .select('*')
      .eq('space_id', spaceId)
      .order('order', { ascending: true });

    // Deduplicate canvases by name — keep the most recent (highest order / latest id) per name
    const seen = new Map<string, typeof canvases[0]>();
    for (const c of (canvases || [])) {
      const prev = seen.get(c.name);
      if (!prev || c.order > prev.order) seen.set(c.name, c);
    }
    const dedupedCanvases = [...seen.values()].sort((a, b) => a.order - b.order);

    return NextResponse.json({
      ...spaceRowToApi(space),
      canvases: dedupedCanvases.map(canvasRowToApi),
      boardSections: (sections || []).map(boardSectionRowToApi),
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
    if (body.emoji !== undefined) {
      updates.emoji = body.emoji;
    }
    if (body.color !== undefined) {
      updates.color = body.color;
    }
    if (body.description !== undefined && typeof body.description === "string") {
      updates.description = body.description;
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

/** DELETE /api/spaces/[spaceId] — delete a space and its canvases */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;

    // Delete all canvases in the space first
    await supabase.from('canvases').delete().eq('space_id', spaceId);

    // Delete the space
    const { error } = await supabase.from('spaces').delete().eq('id', spaceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('API DELETE /api/spaces/[spaceId] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
