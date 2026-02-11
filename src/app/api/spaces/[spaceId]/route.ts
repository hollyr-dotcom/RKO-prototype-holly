import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SPACES_PATH = path.join(process.cwd(), "src/data/spaces.json");
const CANVASES_PATH = path.join(process.cwd(), "src/data/canvases.json");

type Space = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function readSpaces(): Space[] {
  return JSON.parse(fs.readFileSync(SPACES_PATH, "utf-8"));
}

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

/** GET /api/spaces/[spaceId] — single space with its canvases */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const spaces = readSpaces();
  const space = spaces.find((s) => s.id === spaceId);

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const canvases = readCanvases();
  const spaceCanvases = canvases.filter((c) => c.spaceId === spaceId);

  return NextResponse.json({ ...space, canvases: spaceCanvases });
}
