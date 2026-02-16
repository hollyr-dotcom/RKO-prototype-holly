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
  order: number;
};

function readCanvases(): Canvas[] {
  return JSON.parse(fs.readFileSync(CANVASES_PATH, "utf-8"));
}

function writeCanvases(canvases: Canvas[]) {
  fs.writeFileSync(CANVASES_PATH, JSON.stringify(canvases, null, 2) + "\n");
}

/** PATCH /api/canvases/reorder — update the order of canvases within a space */
export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const { spaceId, orderedIds } = await req.json();

    if (typeof spaceId !== "string") {
      return NextResponse.json(
        { error: "spaceId must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array of canvas IDs" },
        { status: 400 }
      );
    }

    const canvases = readCanvases();

    // Only update order for canvases in the specified space
    for (const canvas of canvases) {
      if (canvas.spaceId === spaceId) {
        const newOrder = orderedIds.indexOf(canvas.id);
        if (newOrder !== -1) {
          canvas.order = newOrder;
        }
      }
    }

    writeCanvases(canvases);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
