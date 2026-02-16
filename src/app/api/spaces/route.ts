import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const SPACES_PATH = path.join(process.cwd(), "src/data/spaces.json");
const CANVASES_PATH = path.join(process.cwd(), "src/data/canvases.json");

type Space = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
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
  try {
    await requireAuth();

    const spaces = readSpaces();
    const canvases = readCanvases();

    const spacesWithCounts = spaces
      .map((space) => ({
        ...space,
        canvasCount: canvases.filter((c) => c.spaceId === space.id).length,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json(spacesWithCounts);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const spaces = readSpaces();
    const now = new Date().toISOString();

    // Assign order to the end of the list
    const maxOrder = spaces.reduce((max, s) => Math.max(max, s.order ?? 0), -1);

    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name,
      description: description || "",
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    };

    spaces.push(newSpace);
    writeSpaces(spaces);

    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
