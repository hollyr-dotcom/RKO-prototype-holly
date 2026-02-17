import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const FEED_PATH = path.join(process.cwd(), "src/data/feed-items.json");

type FeedItemRaw = {
  id: string;
  type: string;
  spaceId: string;
  timestamp: string;
  priority: string;
  [key: string]: unknown;
};

function readFeedItems(): FeedItemRaw[] {
  return JSON.parse(fs.readFileSync(FEED_PATH, "utf-8"));
}

/** GET /api/spaces/[spaceId]/feed — feed items for a space */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    await requireAuth();

    const { spaceId } = await params;
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get("type");
    const priorityFilter = url.searchParams.get("priority");

    let items = readFeedItems().filter((item) => item.spaceId === spaceId);

    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter);
    }
    if (priorityFilter) {
      items = items.filter((item) => item.priority === priorityFilter);
    }

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
