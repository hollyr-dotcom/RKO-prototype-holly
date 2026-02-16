import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const CANVASES_PATH = path.join(process.cwd(), "src/data/canvases.json");

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
};

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

function writeCanvases(canvases: Canvas[]) {
  fs.writeFileSync(CANVASES_PATH, JSON.stringify(canvases, null, 2) + "\n");
}

/** GET /api/canvases — list all canvases (reads from src/data, not public) */
export async function GET() {
  const canvases = readCanvases();
  return NextResponse.json(canvases);
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

    const canvases = readCanvases();
    const now = new Date().toISOString();

    // Assign order to the end of the list within the same space
    const targetSpaceId = spaceId || "";
    const maxOrder = canvases
      .filter((c) => c.spaceId === targetSpaceId)
      .reduce((max, c) => Math.max(max, c.order ?? 0), -1);

    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      spaceId: targetSpaceId,
      name,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    };

    canvases.push(newCanvas);
    writeCanvases(canvases);

    return NextResponse.json(newCanvas, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
