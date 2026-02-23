import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Voice mode sticker lookup endpoint.
 * Mirrors the findBestSticker logic from the chat route — reads
 * miroPacks.json and returns the best-matching sticker for the intent.
 */

interface StickerPack {
  id: string;
  name: string;
  stickers: {
    id: string;
    image: { url: string; dimensions: { width: string | number; height: string | number } };
    keywords: string[];
  }[];
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const { intent } = await req.json();

    if (!intent || typeof intent !== "string") {
      return NextResponse.json(
        { error: "Missing intent parameter" },
        { status: 400 }
      );
    }

    const packsPath = path.join(process.cwd(), "src/data/miroPacks.json");
    const miroPacks: StickerPack[] = JSON.parse(
      fs.readFileSync(packsPath, "utf-8")
    );

    const queryWords = intent.toLowerCase().split(/\s+/);
    let bestScore = 0;
    let bestSticker: StickerPack["stickers"][0] | null = null;

    for (const pack of miroPacks) {
      for (const sticker of pack.stickers) {
        let score = 0;
        for (const word of queryWords) {
          for (const keyword of sticker.keywords) {
            const kw = keyword.toLowerCase();
            if (kw === word) {
              score += 3;
            } else if (kw.includes(word) || word.includes(kw)) {
              score += 1;
            }
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestSticker = sticker;
        }
      }
    }

    if (!bestSticker || bestScore === 0) {
      return NextResponse.json({ error: "No matching sticker found", intent });
    }

    const w =
      typeof bestSticker.image.dimensions.width === "number"
        ? bestSticker.image.dimensions.width
        : parseInt(bestSticker.image.dimensions.width, 10);
    const h =
      typeof bestSticker.image.dimensions.height === "number"
        ? bestSticker.image.dimensions.height
        : parseInt(bestSticker.image.dimensions.height, 10);

    return NextResponse.json({
      created: "sticker",
      url: bestSticker.image.url,
      width: w,
      height: h,
      stickerId: bestSticker.id,
    });
  } catch (error) {
    console.error("Voice sticker error:", error);
    return NextResponse.json({
      error: String(error),
    });
  }
}
