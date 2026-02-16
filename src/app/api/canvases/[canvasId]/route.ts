import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const CANVASES_PATH = path.join(process.cwd(), "src/data/canvases.json");

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
};

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

function writeCanvases(canvases: Canvas[]) {
  fs.writeFileSync(CANVASES_PATH, JSON.stringify(canvases, null, 2) + "\n");
}

/** GET /api/canvases/[canvasId] — single canvas metadata */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  try {
    await requireAuth();

    const { canvasId } = await params;
    const canvases = readCanvases();
    const canvas = canvases.find((c) => c.id === canvasId);

    if (!canvas) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    return NextResponse.json(canvas);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const canvases = readCanvases();
    const index = canvases.findIndex((c) => c.id === canvasId);

    if (index === -1) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    // Only allow updating specific fields
    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      canvases[index].name = body.name.trim();
    }
    if (body.emoji !== undefined) {
      canvases[index].emoji = body.emoji;
    }

    canvases[index].updatedAt = new Date().toISOString();
    writeCanvases(canvases);

    return NextResponse.json(canvases[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
