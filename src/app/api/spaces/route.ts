import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import { supabase } from "@/lib/supabase";
import { spaceRowToApi } from "@/lib/supabase-types";

/** GET /api/spaces — list all spaces with canvas counts */
export async function GET() {
  try {
    await requireAuth();

    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;

    const { data: counts, error: countError } = await supabase
      .from('canvases')
      .select('space_id');

    if (countError) throw countError;

    const countMap: Record<string, number> = {};
    for (const row of counts || []) {
      countMap[row.space_id] = (countMap[row.space_id] || 0) + 1;
    }

    const result = (spaces || []).map(row => ({
      ...spaceRowToApi(row),
      canvasCount: countMap[row.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/spaces error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/spaces — create a new space */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: maxRow } = await supabase
      .from('spaces')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const maxOrder = maxRow?.order ?? -1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        id: `space-${Date.now()}`,
        name,
        description: description || '',
        created_at: now,
        updated_at: now,
        order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(spaceRowToApi(data), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/spaces error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
