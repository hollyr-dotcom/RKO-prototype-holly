import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Generate ephemeral token for OpenAI Realtime API
 * Tokens are short-lived (1-60 min) and safe to use in browser
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Request ephemeral token from OpenAI (using beta API)
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          model: "gpt-realtime", // Latest GA model (better than preview)
          voice: "marin", // New high-quality voice (options: marin, cedar, or alloy, ash, ballad, coral, echo, sage, shimmer, verse)
          input_audio_transcription: {
            model: "gpt-4o-transcribe", // Enable user speech transcription
          },
          instructions: `Create visual artifacts on a whiteboard canvas.

VISUAL CONTEXT:
You receive canvas screenshots showing spatial layout, positioning, grouping, hierarchy, and spacing.

COMMUNICATION RULES:
- State actions directly
- No acknowledgments, confirmations, or check-ins
- No questions, offers, or suggestions
- No filler words or transitions
- Report completion with facts only

RESEARCH:
When user requests research:
1. Call webSearch() with query
2. Call createSources() with results:
   createSources({
     title: "Research: [topic]",
     sources: results.map(r => ({ title: r.title, url: r.url, description: r.snippet, image: r.image }))
   })
3. State key findings (2-3 facts)

FOLLOW-UPS:
Execute requested analysis without acknowledgment.

PRINCIPLES LAYOUT:
Use type: "hierarchy" for principles.
Group by category. Categories are parent nodes (parentIndex: -1, color: "blue").
Principles are children (parentIndex: 0/2/4..., color: "light-blue").

Example:
createLayout({
  type: 'hierarchy',
  frameName: 'Design Principles',
  items: [
    {text:'User Experience', color:'blue', parentIndex:-1},
    {text:'Prioritize clarity', color:'light-blue', parentIndex:0},
    {text:'Trust & Ethics', color:'blue', parentIndex:-1},
    {text:'Be transparent', color:'light-blue', parentIndex:2},
    {text:'Performance', color:'blue', parentIndex:-1},
    {text:'Optimize speed', color:'light-blue', parentIndex:4}
  ]
})

UPDATES:
Use createLayout() with replaceFrame parameter to replace existing frames atomically.

EXECUTION:
Execute tasks immediately without stating plans or requesting approval.`,
          tools: [
            {
              type: "function",
              name: "webSearch",
              description: "Search the web for current information. Returns actual results with titles, URLs, and snippets. After receiving results, use createSources() to display them visually on the canvas.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "What to search for" },
                  purpose: { type: "string", description: "Why you need this info" }
                },
                required: ["query", "purpose"]
              }
            },
            {
              type: "function",
              name: "createSources",
              description: "Display search results visually on canvas as rich bookmark cards with previews. Call this after webSearch() using the results you received.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Frame title, e.g. 'Research: AI trends'" },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Page title from search results" },
                        url: { type: "string", description: "URL of the source" },
                        description: { type: "string", description: "Snippet/description from search results" },
                        image: { type: "string", description: "Image URL for thumbnail" }
                      },
                      required: ["title", "url"]
                    },
                    description: "Sources from webSearch results"
                  }
                },
                required: ["title", "sources"]
              }
            },
            {
              type: "function",
              name: "createLayout",
              description: "Create visual layouts. GRID: sticky notes for brainstorms. HIERARCHY: shapes for principles with parent-child arrows. FLOW: shapes for processes.",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["grid", "hierarchy", "flow"], description: "grid for brainstorm stickies, hierarchy for principles with arrows, flow for processes" },
                  frameName: { type: "string" },
                  replaceFrame: { type: "string", description: "Name of existing frame to replace" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Content text" },
                        color: { type: "string", description: "yellow/green/orange/violet/pink for stickies, blue/light-blue for hierarchy" },
                        parentIndex: { type: "number", description: "HIERARCHY ONLY: -1 for root items, or index of parent (0, 2, 4...) for children" }
                      },
                      required: ["text"]
                    }
                  },
                  columns: { type: "number" },
                  direction: { type: "string", enum: ["down", "right"] },
                  spacing: { type: "string", enum: ["compact", "normal", "spacious"] }
                },
                required: ["type", "frameName", "items"]
              }
            },
            {
              type: "function",
              name: "showProgress",
              description: "Show which step you're working on",
              parameters: {
                type: "object",
                properties: {
                  stepNumber: { type: "number" },
                  stepTitle: { type: "string" },
                  status: { type: "string", enum: ["starting", "completed"] }
                },
                required: ["stepNumber", "stepTitle", "status"]
              }
            },
            {
              type: "function",
              name: "deleteFrame",
              description: "Delete an existing frame and all its contents. Use this when the user asks to change or update something - delete the old version first, then create the new one.",
              parameters: {
                type: "object",
                properties: {
                  frameName: { type: "string", description: "Name of the frame to delete (e.g. 'Design Team Org Chart')" }
                },
                required: ["frameName"]
              }
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", {
        status: response.status,
        statusText: response.statusText,
        error: error,
      });
      return NextResponse.json(
        { error: "Failed to create ephemeral token", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret?.value || data.client_secret,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
