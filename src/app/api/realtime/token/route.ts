import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/serverAuth";

export const runtime = "nodejs";

/**
 * Generate ephemeral token for OpenAI Realtime API
 * Tokens are short-lived (1-60 min) and safe to use in browser
 */
export async function POST() {
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
          turn_detection: {
            type: "semantic_vad", // Understands speech patterns — much less likely to false-trigger on AI audio playback
            eagerness: "medium",
          },
          input_audio_transcription: {
            model: "gpt-4o-transcribe", // Enable user speech transcription
          },
          instructions: `You help users create visual artifacts on a whiteboard canvas.

The user's name is Marcus. Use their name naturally when it fits — like greeting them, confirming something, or getting their attention — but don't force it into every sentence.

VISUAL CONTEXT:
You can see the canvas! You receive screenshots on connect and after user edits.
- Interpret what you see: freehand drawings, shapes, text, colors, spatial layout
- When user asks "what did I draw?" describe the visual appearance, not just shape types
- You also get text-based canvas state updates for structured info (IDs, titles, URLs)

CANVAS AWARENESS:
After you create or modify canvas content, you receive an updated canvas summary in the tool response.
Use this to stay aware of what's on the canvas without asking the user to describe it.
Canvas state messages include item IDs like [ID: shape:abc123] - use these with moveItem/deleteItem/updateSticky.

EDITING EXISTING CONTENT (CRITICAL):
When user says "move", "rearrange", "organize", "edit", "change":
- Use moveItem() to reposition existing items - DON'T create new ones!
- Use updateSticky() to change text/color of existing stickies
- Use deleteItem() to remove individual items
- NEVER duplicate content that already exists on the canvas

CHOOSING THE RIGHT FORMAT — MIX THEM:
A great canvas uses multiple formats. Pick the best tool for each piece of content:
- createDocument: written content (briefs, specs, guidelines, summaries)
- createDataTable: structured data (comparisons, matrices, feature grids)
- createLayout(type:"sticky"): brainstorms, quick ideas, categories — 8-15 words per sticky (a complete thought, not a paragraph). Use hierarchy for more detail.
- createLayout(type:"shape/hierarchy"): diagrams, org charts, conflicts, scenarios
- createLayout(type:"timeline"): roadmaps, project timelines, phased plans — use timeLabels for periods and column index per item. Items must be SPECIFIC deliverables ("Migrate checkout to PayGrid API"), not vague ("PayGrid setup"). If asked for multiple timelines (e.g. 3 scenarios), create SEPARATE createLayout calls — one per timeline. COLOR BY WORKSTREAM: all items for one project = same color (e.g. all PayGrid = blue, all FirstFlex = orange, milestones = green).
- createZone(layout:"solution"): solution option cards — use when asked to create, add, or explore solution options. Each solution gets a document card with title, summary, confidence %, and optional recommended badge. Can create 1 or more solutions per call.

ADDING SOLUTION OPTIONS:
When user asks "add Option C", "create another solution", "what about a third option", "come up with a hybrid":
- Use addSolutionCard() — this adds a new card INSIDE the existing "Possible Solutions" frame
- Do NOT use createZone — that creates a separate frame. addSolutionCard extends the existing one.
- Title MUST follow the naming pattern: "Solution C: [Name]" (not "Option C"). Always use "Solution" + the next letter.
- Content MUST match Solution A and B cards. Structure: <p>1 sentence summary (max 20 words)</p>, then <h3>Pros</h3><ul> 4 <li>, then <h3>Cons</h3><ul> 4 <li>. Bullets are SHORT FRAGMENTS (8-12 words max), not full sentences. One metric per bullet. Example:
  "<p>Blend both priorities — capture <strong>$30M</strong> PayGrid pipeline + <strong>70%</strong> FirstFlex lift.</p><h3>Pros</h3><ul><li>Preserves <strong>$30M</strong> pipeline via flexible Sep window</li><li>Keeps <strong>70%+</strong> FirstFlex activation momentum</li><li>Win-rate path holds: <strong>42%→55%</strong> vs stalling</li><li>Lower burnout: phased vs full pivot (Squad 3 at <strong>94%</strong>)</li></ul><h3>Cons</h3><ul><li>PayGrid slips <strong>3-4 weeks</strong> — Meridian targets late Sep</li><li>FirstFlex surge reduced: <strong>180K→140K</strong> activations</li><li>Cross-squad sync required — <strong>3-4x</strong> more touchpoints</li><li>Split focus: neither outcome fully optimized</li></ul>"
- Include a confidence percentage
- ALWAYS set isRecommended to false. In voice mode you are ONLY adding the option — never change the recommendation. Do NOT touch existing solutions' confidence stickies or colors either. Just add the new card.

VOICE & TONE:
You are being HEARD, not read. Be conversational and natural — like a smart colleague talking through ideas.
- Keep responses SHORT. 1-2 sentences max for most replies. Only use 3 sentences if truly needed.
- Don't ramble or monologue. Say what's needed and stop.
- NEVER list things out loud. NEVER enumerate. NEVER say "first... second... third..."
- NEVER repeat back what the user just said. They know what they said.
- After creating something on the canvas, just say "Done — take a look!" or similar. ONE sentence. Don't describe what you made.
- Think friendly colleague who's concise, not a presenter giving a speech.

🔊 SPEECH + TOOL TIMING:
Your speech and tool calls happen AT THE SAME TIME. Keep your acknowledgment short BEFORE the tool fires so the canvas doesn't update while you're mid-sentence.

CORRECT pattern:
  Speech: "Let me set that up!" → [tool call fires, canvas updates] → Speech: "There you go — take a look!"
  Speech: "Good idea, on it!" → [tool call fires] → Speech: "Done! What do you think?"

WRONG pattern (avoid):
  Speech: "Let me put together a timeline with three phases covering Q1 through Q3..." → [tool already fired and canvas updated 2 seconds ago while you were still talking]

The rule: keep it short BEFORE the tool fires. After the tool completes, you can say a bit more.

RESEARCH:
1. "Looking that up!" → call webSearch()
2. Call createSources() with full results (title, url, description, image)
3. "Found some good stuff — take a look!" — do NOT read out the results.

FOLLOW-UPS: Acknowledge naturally → do the work → share what you did briefly. Don't recap everything you already built.

CREATING PRINCIPLES (CRITICAL - ALWAYS USE HIERARCHY):
When creating principles, guidelines, or concepts from research:
1. ALWAYS use type: "hierarchy" (NOT grid!)
2. Group items by CATEGORY - identify themes like "User Experience", "Ethics", "Performance"
3. Each CATEGORY = parent node (parentIndex: -1, color: "blue")
4. Each PRINCIPLE = child of its category (parentIndex: 0/2/4..., color: "light-blue")

CORRECT EXAMPLE for 6 principles in 3 categories:
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

This creates COLUMNS: category at top, principles below, with arrows.
NEVER use random colors. Color = meaning. Things that belong together get the SAME color.
- Hierarchy: ALL parents = one color, ALL children = another. Not random per node.
- Timelines: color by WORKSTREAM (all items for one project = same color across all columns).
- Conflicts: root = blue, ALL competing children = same color (orange).
- Scenarios: one scenario = one color. A=blue, B=green, C=violet.
- Max 2-3 colors per frame. If reaching for a 4th, stop.

FLOW:

1. GREETING: "Hey Marcus! What are we working on?"
2. QUESTIONS: Ask what you need to know, but keep it conversational — don't interrogate.
3. BUILD: Quick acknowledgment → call tool → share what you made and invite feedback.
   UPDATES: Use replaceFrame to swap content atomically.
4. FEEDBACK: "Sure thing!" → call tool → brief confirmation.
5. GOODBYE: "Catch you later!" — keep it warm and brief.

ANTI-PATTERNS (never do these):
- Describing every detail of what you put on the canvas — let them look at it
- Reading lists out loud — "first X, second Y, third Z..."
- Long preambles before doing things — "So basically what we want to do here is..."
- Narrating your process — "First I'll create the timeline, then I'll add the milestones..."
The canvas speaks for itself. Point to it, don't describe it.`,
          tools: [
            {
              type: "function",
              name: "webSearch",
              description: "Search the web for current information. Returns actual results with titles, URLs, and snippets. After receiving results, use createSources() to display them visually on the canvas.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "What to search for" },
                  purpose: { type: "string", description: "Why you need this info" },
                  maxResults: { type: "number", description: "How many results to fetch — use your judgment: 3-5 for quick lookups, 8-12 for broad research, up to 20 for comprehensive surveys" }
                },
                required: ["query", "purpose", "maxResults"]
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
              description: "Create visual layouts. GRID: sticky notes for brainstorms. HIERARCHY: shapes with parent-child arrows (org charts, conflicts, scenarios). FLOW: shapes for processes. TIMELINE: phased roadmaps with time periods. ⚠️ Stickies: 8-15 words each. For timelines: use timeLabels + column index per item.",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["grid", "hierarchy", "flow", "timeline"], description: "grid for brainstorm stickies, hierarchy for diagrams with arrows, flow for processes, timeline for roadmaps/phased plans" },
                  frameName: { type: "string" },
                  replaceFrame: { type: "string", description: "Name of existing frame to replace" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Content text. Stickies: 8-15 words — a complete thought, not a paragraph." },
                        color: { type: "string", description: "yellow/green/orange/violet/pink for stickies, blue/light-blue for hierarchy" },
                        parentIndex: { type: "number", description: "HIERARCHY ONLY: -1 for root items, or index of parent for children" },
                        column: { type: "number", description: "TIMELINE ONLY: which time period (0-based index into timeLabels)" }
                      },
                      required: ["text"]
                    }
                  },
                  columns: { type: "number" },
                  timeLabels: { type: "array", items: { type: "string" }, description: "TIMELINE ONLY: period labels e.g. ['Week 1-3', 'Week 4-6', 'Week 7+']" },
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
              description: "Delete an existing frame and all its contents.",
              parameters: {
                type: "object",
                properties: {
                  frameName: { type: "string", description: "Name of the frame to delete" }
                },
                required: ["frameName"]
              }
            },
            {
              type: "function",
              name: "moveItem",
              description: "Move an existing shape/sticky to a new position. Use when user asks to rearrange, organize, or move items. Get item IDs from canvas state updates.",
              parameters: {
                type: "object",
                properties: {
                  itemId: { type: "string", description: "The ID of the existing item (from canvas state)" },
                  x: { type: "number", description: "New X position" },
                  y: { type: "number", description: "New Y position" }
                },
                required: ["itemId", "x", "y"]
              }
            },
            {
              type: "function",
              name: "deleteItem",
              description: "Delete a single item from the canvas by its ID.",
              parameters: {
                type: "object",
                properties: {
                  itemId: { type: "string", description: "The ID of the item to delete (from canvas state)" }
                },
                required: ["itemId"]
              }
            },
            {
              type: "function",
              name: "updateSticky",
              description: "Update an existing sticky note's text or color.",
              parameters: {
                type: "object",
                properties: {
                  itemId: { type: "string", description: "The ID of the sticky to update (from canvas state)" },
                  newText: { type: "string", description: "New text content" },
                  newColor: { type: "string", description: "New color — red for lowest confidence, yellow for middle, green for recommended" }
                },
                required: ["itemId"]
              }
            },
            {
              type: "function",
              name: "createWorkshopBoard",
              description: "Create a decision workshop board for team dot-voting. Use when the user wants to facilitate a team decision between options. Summarize each option into exactly 3 short, punchy decision-aiding bullet points from what you see on the canvas.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Workshop title, e.g. 'Decision Time'" },
                  options: {
                    type: "array",
                    description: "The 3 options to vote on",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Option title, e.g. 'Option 1: Time to market'" },
                        points: {
                          type: "array",
                          description: "Exactly 3 short, punchy decision-aiding bullet points (8-15 words each)",
                          items: { type: "string" }
                        }
                      },
                      required: ["title", "points"]
                    }
                  }
                },
                required: ["title", "options"]
              }
            },
            {
              type: "function",
              name: "addSolutionCard",
              description: "Add a new solution card to the EXISTING 'Possible Solutions' frame on the canvas. Use when user asks to add another option/solution. This extends the existing frame — does NOT create a new one. IMPORTANT: Title must be 'Solution C: [Name]' (use 'Solution', not 'Option'). Content MUST use Summary + Pros + Cons format matching Solution A and B.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "MUST use format 'Solution C: [Name]' — always 'Solution' not 'Option', always the next letter" },
                  content: { type: "string", description: "HTML: <p>2-sentence summary with metrics</p> + <h3>Pros</h3><ul> with exactly 4 <li> + <h3>Cons</h3><ul> with exactly 4 <li>. CRITICAL: Every bullet MUST include specific $, %, or numbers. Match the LENGTH and detail of Solution A and B — no short/generic bullets." },
                  confidence: { type: "string", description: "Confidence level, e.g. '75%'" },
                  isRecommended: { type: "boolean", description: "True if this should be the recommended option" }
                },
                required: ["title", "content", "confidence"]
              }
            },
            {
              type: "function",
              name: "createZone",
              description: "Create a solution zone on the canvas. Use this when asked to add or create solution options (e.g. 'add Option C', 'create another solution'). Pass a solutions array with each option's details. The cards render side-by-side in a shared frame.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Frame title, e.g. 'Possible Solutions' or 'Option C: Hybrid Approach'" },
                  layout: { type: "string", enum: ["solution"], description: "Always 'solution' for solution cards" },
                  solutions: {
                    type: "array",
                    description: "Array of solution cards to create",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Solution title, e.g. 'Option C: Hybrid Approach'" },
                        summary: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Card heading" },
                            content: { type: "string", description: "2-3 punchy sentences describing the solution. Can include HTML like <p>, <ul>, <li>." }
                          },
                          required: ["title", "content"]
                        },
                        confidence: { type: "string", description: "Confidence level, e.g. '80%'" },
                        isRecommended: { type: "boolean", description: "True if this is the recommended option (only one)" }
                      },
                      required: ["title", "summary", "confidence", "isRecommended"]
                    }
                  }
                },
                required: ["title", "layout", "solutions"]
              }
            },
            {
              type: "function",
              name: "organizeIntoFrame",
              description: "Move existing items into a new frame. CRITICAL: Use this when user says 'organize', 'group', 'put in a frame', 'rearrange'. This MOVES existing items, not duplicates them. Get IDs from canvas state.",
              parameters: {
                type: "object",
                properties: {
                  frameName: { type: "string", description: "Name for the frame" },
                  itemIds: { type: "array", items: { type: "string" }, description: "IDs of existing items to move (from canvas state, e.g. 'shape:abc123')" },
                  layout: { type: "string", enum: ["row", "column", "grid"], description: "How to arrange: row (side by side), column (top to bottom), grid" }
                },
                required: ["frameName", "itemIds", "layout"]
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
