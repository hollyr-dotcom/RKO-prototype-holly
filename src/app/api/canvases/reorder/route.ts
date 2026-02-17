import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";

/** PATCH /api/canvases/reorder — update the order of canvases within a space */
export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const { spaceId, orderedIds } = await req.json();

    if (typeof spaceId !== "string") {
      return NextResponse.json(
        { error: "spaceId must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array of canvas IDs" },
        { status: 400 }
      );
    }

    const updates = orderedIds.map((id: string, index: number) =>
      supabase
        .from('canvases')
        .update({ order: index })
        .eq('id', id)
        .eq('space_id', spaceId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('PATCH /api/canvases/reorder error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
