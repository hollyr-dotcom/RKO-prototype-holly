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

function writeSpaces(spaces: Space[]) {
  fs.writeFileSync(SPACES_PATH, JSON.stringify(spaces, null, 2) + "\n");
}

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

/** GET /api/spaces — list all spaces with canvas counts */
export async function GET() {
  const spaces = readSpaces();
  const canvases = readCanvases();

  const spacesWithCounts = spaces.map((space) => ({
    ...space,
    canvasCount: canvases.filter((c) => c.spaceId === space.id).length,
  }));

  return NextResponse.json(spacesWithCounts);
}

/** POST /api/spaces — create a new space */
export async function POST(req: Request) {
  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const spaces = readSpaces();
  const now = new Date().toISOString();

  const newSpace: Space = {
    id: `space-${Date.now()}`,
    name,
    description: description || "",
    createdAt: now,
    updatedAt: now,
  };

  spaces.push(newSpace);
  writeSpaces(spaces);

  return NextResponse.json(newSpace, { status: 201 });
}
