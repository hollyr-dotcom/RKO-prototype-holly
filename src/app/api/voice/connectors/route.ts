import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Voice mode connector query endpoint.
 * Mirrors the queryConnectors tool from the chat route — reads from
 * src/data/connectors.json and returns matching service data.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const { services, purpose } = await req.json();

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty services array" },
        { status: 400 }
      );
    }

    const connectorsPath = path.join(process.cwd(), "src/data/connectors.json");
    const raw = JSON.parse(fs.readFileSync(connectorsPath, "utf-8"));
    const allSources = raw.integrationSources?.sources || [];

    const results: Array<{ service: string; items: unknown[] }> = [];
    for (const svc of services) {
      const sourceId = `source-${svc}`;
      const source = allSources.find((s: { id: string }) => s.id === sourceId);
      if (source) {
        results.push({
          service: source.service,
          items: source.fetchedItems || [],
        });
      }
    }

    return NextResponse.json({
      purpose,
      queriedServices: results.map((r) => r.service),
      serviceCount: results.length,
      data: results,
      instruction:
        "Synthesize these findings into canvas content. Reference real numbers, names, and data points from the results.",
    });
  } catch (error) {
    console.error("Voice connectors error:", error);
    return NextResponse.json({
      error: String(error),
      data: [],
    });
  }
}
