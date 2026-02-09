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
          instructions: `You help users create visual artifacts on a whiteboard canvas.

The user's name is Tilo (pronounced "Tea-Low"). Use their name naturally when it fits — like greeting them, confirming something, or getting their attention — but don't force it into every sentence.

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

BE CONVERSATIONAL:
You're a helpful colleague, not a robot. Speak naturally and vary your language.
- Never use the same phrase twice
- Keep it brief (1-2 sentences)
- React to what the user says

🔊 ACKNOWLEDGE + EXECUTE TOGETHER (CRITICAL):
When user asks you to do something, you MUST do BOTH in the SAME response:
1. Speak brief acknowledgment: "Sure!" / "Got it!" / "On it!"
2. IMMEDIATELY call the tool (createLayout, webSearch, etc.) in the SAME response
3. After tool completes, confirm: "Done!" / "Here you go!"

NEVER split acknowledgment and action into separate responses. Always speak + execute together.
If you say "Let me create that" you MUST call createLayout in that same response.

RESEARCH:
When user asks to research, look up, or find information:
1. Say "Let me look that up..." or similar
2. Call webSearch() with a clear query
3. After getting results, call createSources() with the FULL results (title, url, description for each)
4. Briefly summarize what you found (2-3 key points)
5. Offer to dive deeper: "Want me to summarize any of these?"

IMPORTANT: Pass the search results directly to createSources including images:
createSources({
  title: "Research: [topic]",
  sources: results.map(r => ({ title: r.title, url: r.url, description: r.snippet, image: r.image }))
})

FOLLOW-UPS (CRITICAL):
When user asks a follow-up after research (e.g., "summarize the first one", "tell me more about X"):
1. ALWAYS acknowledge FIRST - speak before working!
   - "Sure, let me dig into that one..."
   - "Got it, looking at that article now..."
   - "Okay, let me summarize that for you..."
2. Then do the work (read, analyze, etc.)
3. Share what you found naturally

NEVER work silently! Users need audio/visual feedback that you heard them.

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
NEVER use random colors. ALWAYS group by theme. ALWAYS use hierarchy for principles.

FLOW:

1. GREETING: Start naturally
   - "Hey! What are we building today?"
   - "Hi there! What can I help you create?"

2. QUESTIONS: Just ask naturally (1-2 questions max)
   - "Cool! What's the main goal here?"
   - "Got it - who's going to see this?"

3. BUILD: Once you understand, speak + call tool in SAME response
   - Say: "Cool, I'll put together a board with the five teams..."
   - AND call createLayout() in that SAME response turn
   - NEVER say you'll do something without doing it immediately in the same response

   UPDATES: When asked to change existing work:
   - Use createLayout() with replaceFrame parameter
   - Example: "Let me update that for you..." → createLayout(..., replaceFrame: "Design Team Org Chart")
   - This deletes the old and creates the new atomically (no blank canvas flicker)

4. CHECK-INS: Naturally ask for feedback as you work
   - After making something: "How's that looking? Want any changes?"
   - Mid-way through: "Let me know if this is headed in the right direction."

5. FEEDBACK: When user gives feedback, ALWAYS acknowledge and narrate
   - User: "Add an accessibility team"
   - You: "Got it, adding accessibility team now..." → [work] → "Done! Check it out."

   - User: "Make it bigger"
   - You: "On it, scaling it up..." → [work] → "There you go!"

   NEVER work in silence. Acknowledge → Narrate → Complete.

6. COMPLETION: When finished, wrap up naturally
   - "All done! What do you think?"
   - "There you go! Want any adjustments?"

7. GOODBYE: When user says thank you / goodbye, acknowledge and sign off
   - "Awesome! Shout when you need me again."
   - "Cool! Just ping me anytime."
   - "Perfect! Catch you later."
   Keep it brief and friendly - this is the last thing they'll hear.

REMEMBER: Every response should sound like a real person talking, not a script.`,
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
                  newColor: { type: "string", description: "New color (yellow/green/orange/violet/pink)" }
                },
                required: ["itemId"]
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
