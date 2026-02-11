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

function writeCanvases(canvases: Canvas[]) {
  fs.writeFileSync(CANVASES_PATH, JSON.stringify(canvases, null, 2) + "\n");
}

/** POST /api/canvases — create a new canvas in a space */
export async function POST(req: Request) {
  const { name, spaceId } = await req.json();

  if (!name || !spaceId) {
    return NextResponse.json(
      { error: "Name and spaceId are required" },
      { status: 400 }
    );
  }

  const canvases = readCanvases();
  const now = new Date().toISOString();

  const newCanvas: Canvas = {
    id: `canvas-${Date.now()}`,
    spaceId,
    name,
    createdAt: now,
    updatedAt: now,
  };

  canvases.push(newCanvas);
  writeCanvases(canvases);

  return NextResponse.json(newCanvas, { status: 201 });
}
