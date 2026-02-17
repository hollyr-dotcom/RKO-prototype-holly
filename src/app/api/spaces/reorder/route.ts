import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";

/** PATCH /api/spaces/reorder — update the order of spaces */
export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array of space IDs" },
        { status: 400 }
      );
    }

    const updates = orderedIds.map((id: string, index: number) =>
      supabase
        .from('spaces')
        .update({ order: index })
        .eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('PATCH /api/spaces/reorder error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
