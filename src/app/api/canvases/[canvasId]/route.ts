import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CANVASES_PATH = path.join(process.cwd(), "src/data/canvases.json");

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

/** GET /api/canvases/[canvasId] — single canvas metadata */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  const { canvasId } = await params;
  const canvases = readCanvases();
  const canvas = canvases.find((c) => c.id === canvasId);

  if (!canvas) {
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }

  return NextResponse.json(canvas);
}
