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
};

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
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

/** GET /api/spaces/[spaceId] — single space with its canvases */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;
    const spaces = readSpaces();
    const space = spaces.find((s) => s.id === spaceId);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const canvases = readCanvases();
    const spaceCanvases = canvases
      .filter((c) => c.spaceId === spaceId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json({ ...space, canvases: spaceCanvases });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/** PATCH /api/spaces/[spaceId] — update space fields (e.g. name) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;
    const body = await req.json();
    const spaces = readSpaces();
    const index = spaces.findIndex((s) => s.id === spaceId);

    if (index === -1) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Only allow updating specific fields
    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      spaces[index].name = body.name.trim();
    }

    spaces[index].updatedAt = new Date().toISOString();
    writeSpaces(spaces);

    return NextResponse.json(spaces[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
