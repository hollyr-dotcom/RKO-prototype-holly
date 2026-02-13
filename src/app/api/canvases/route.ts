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

    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      spaceId: spaceId || "",
      name,
      createdAt: now,
      updatedAt: now,
    };

    canvases.push(newCanvas);
    writeCanvases(canvases);

    return NextResponse.json(newCanvas, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
