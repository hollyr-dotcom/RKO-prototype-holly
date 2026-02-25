import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth/serverAuth";

const FEED_PATH = path.join(process.cwd(), "src/data/feed-items.json");
const SPACES_PATH = path.join(process.cwd(), "src/data/spaces.json");

type FeedItemRaw = {
  id: string;
  type: string;
  spaceId: string;
  timestamp: string;
  [key: string]: unknown;
};

type SpaceRaw = {
  id: string;
  name: string;
};

function readFeedItems(): FeedItemRaw[] {
  return JSON.parse(fs.readFileSync(FEED_PATH, "utf-8"));
}

function readSpaces(): SpaceRaw[] {
  return JSON.parse(fs.readFileSync(SPACES_PATH, "utf-8"));
}

/** Prefixes for duplicate items that only belong in their specific spaces */
const DUPLICATE_PREFIXES = [
  "feed-org27-", "feed-revops-", "feed-ff26-", "feed-epd-",
  "feed-1on1-james-", "feed-1on1-amara-", "feed-1on1-daniel-",
];

/** GET /api/feed — all feed items across all spaces (excludes space-only duplicates) */
export async function GET() {
  try {
    await requireAuth();

    const spaces = readSpaces();
    const spaceNameMap = new Map(spaces.map((s) => [s.id, s.name]));

    const items = readFeedItems()
      .filter((item) => !DUPLICATE_PREFIXES.some((p) => item.id.startsWith(p)))
      .map((item) => ({
        ...item,
        spaceName: spaceNameMap.get(item.spaceId) ?? "Unknown",
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
