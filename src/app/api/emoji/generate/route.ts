import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";

const OPENAI_API_URL = "https://api.openai.com/v1/images/generations";

function buildEmojiPrompt(input: string): string {
  return `A single emoji icon of ${input}. Flat design, vibrant colors, solid white background, centered composition, no text, no border, clean vector style, 3D-ish with subtle shading like Apple emoji.`;
}

/** POST /api/emoji/generate — generate a custom emoji image from a text prompt */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: buildEmojiPrompt(prompt),
        n: 1,
        size: "1024x1024",
        quality: "low",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.error?.message ??
        `OpenAI API request failed with status ${response.status}`;
      console.error("Emoji generation failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "No image data returned from API" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`,
    });
  } catch (error) {
    console.error("Emoji generation error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
