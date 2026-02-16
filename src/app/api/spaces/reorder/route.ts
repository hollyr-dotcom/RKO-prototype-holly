import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const SPACES_PATH = path.join(process.cwd(), "src/data/spaces.json");

type Space = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  order: number;
};

function readSpaces(): Space[] {
  return JSON.parse(fs.readFileSync(SPACES_PATH, "utf-8"));
}

function writeSpaces(spaces: Space[]) {
  fs.writeFileSync(SPACES_PATH, JSON.stringify(spaces, null, 2) + "\n");
}

/** PATCH /api/spaces/reorder — update the order of spaces */
export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array of space IDs" },
        { status: 400 }
      );
    }

    const spaces = readSpaces();

    // Update order based on position in the orderedIds array
    for (const space of spaces) {
      const newOrder = orderedIds.indexOf(space.id);
      if (newOrder !== -1) {
        space.order = newOrder;
      }
    }

    writeSpaces(spaces);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
