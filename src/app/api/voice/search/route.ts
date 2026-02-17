import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Voice mode web search endpoint
 * Uses Tavily API for real-time search results
 */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const { query, purpose, maxResults } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter" },
        { status: 400 }
      );
    }

    // Check for pre-canned results first (demo scenario data)
    try {
      const cannedPath = path.join(process.cwd(), "src/data/webSearchResults.json");
      const cannedData = JSON.parse(fs.readFileSync(cannedPath, "utf-8"));
      const queryLower = query.toLowerCase();
      const match = cannedData.resultSets?.find((set: { matchPatterns: string[] }) =>
        set.matchPatterns.some((p: string) => queryLower.includes(p.toLowerCase()))
      );
      if (match) {
        const results = match.results.map((r: { title: string; url: string; content: string; image?: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 200) || "",
          image: r.image || "",
        }));
        return NextResponse.json({
          query,
          purpose,
          results,
          summary: match.answer || "No summary available",
        });
      }
    } catch { /* No canned results file or parse error — fall through to Tavily */ }

    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "No TAVILY_API_KEY configured",
        query,
        purpose,
        results: [],
        summary: "Search is not available - API key not configured",
      });
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: true,
        include_raw_content: false,
        include_images: true,  // Get images for thumbnails
        max_results: Math.min(Math.max(maxResults || 5, 1), 20),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    // Format results for voice mode - include images for thumbnails
    // Tavily returns images in a separate array, match by index
    const imageArray = data.images || [];
    const results = data.results?.map((r: { title: string; url: string; content: string }, index: number) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 200) || "",
      image: imageArray[index] || "",
    })) || [];

    return NextResponse.json({
      query,
      purpose,
      results,
      summary: data.answer || "No summary available",
    });
  } catch (error) {
    console.error("Voice search error:", error);
    return NextResponse.json({
      error: String(error),
      results: [],
      summary: "Search failed - please try again",
    });
  }
}
