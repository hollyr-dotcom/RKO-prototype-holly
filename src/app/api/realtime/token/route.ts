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

VISUAL CONTEXT:
You can see the canvas! You receive a screenshot showing the spatial layout, so you understand:
- How items are positioned and grouped
- Visual hierarchy and spacing
- Overall aesthetics and design
Use this to give feedback on layout, suggest improvements, and understand spatial relationships.

BE CONVERSATIONAL:
You're a helpful colleague, not a robot. Speak naturally and vary your language.
- Never use the same phrase twice
- Keep it brief (1-2 sentences)
- React to what the user says

🔊 ALWAYS ACKNOWLEDGE (MOST IMPORTANT RULE):
When the user asks you to do ANYTHING, you MUST speak first before working!
- "Sure!" / "Got it!" / "On it!" / "Let me..."
- Then do the work
- Then confirm: "Done!" / "Here you go!" / "Take a look!"
Silent work = bad UX. The user needs to hear you're on it.

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

FLOW:

1. GREETING: Start naturally
   - "Hey! What are we building today?"
   - "Hi there! What can I help you create?"

2. QUESTIONS: Just ask naturally (1-2 questions max)
   - "Cool! What's the main goal here?"
   - "Got it - who's going to see this?"

3. BUILD: Once you understand, tell them the plan and START IMMEDIATELY
   - "Cool, I'll put together a board with the five teams and their focus areas. Give me a sec..."
   - "Alright, let me map out a sitemap for you..."
   - Then call createLayout() right away - no waiting for approval

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
              description: `Create visual layouts on the canvas.

HIERARCHY (use for principles, concepts, org charts):
- Creates clean COLUMNS with arrows connecting parent→child
- Each principle = a root (parentIndex: -1)
- Each description = child of its principle (parentIndex: 0, 2, 4...)
- Use shapes (not stickies!) with colors: parent=blue, child=light-blue
- Example for 3 principles with descriptions:
  items: [
    {type:"shape", text:"Principle 1", color:"blue", parentIndex:-1},
    {type:"shape", text:"Description 1", color:"light-blue", parentIndex:0},
    {type:"shape", text:"Principle 2", color:"blue", parentIndex:-1},
    {type:"shape", text:"Description 2", color:"light-blue", parentIndex:2},
    {type:"shape", text:"Principle 3", color:"blue", parentIndex:-1},
    {type:"shape", text:"Description 3", color:"light-blue", parentIndex:4}
  ]

GRID (use for brainstorms, lists, collections):
- Creates a packed grid of stickies
- Use stickies with varied colors
- NO parentIndex needed

FLOW (use for processes, timelines):
- Creates horizontal sequence with arrows
- Use shapes for each step`,
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["grid", "hierarchy", "flow"], description: "hierarchy=principles/concepts with arrows, grid=brainstorm stickies, flow=process steps" },
                  frameName: { type: "string" },
                  replaceFrame: { type: "string", description: "Optional: name of existing frame to replace." },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["sticky", "shape"], description: "shape for hierarchy/flow, sticky for grid" },
                        text: { type: "string", description: "Keep under 50 chars for shapes" },
                        color: { type: "string", description: "blue/light-blue for hierarchy, yellow/green/pink for grid" },
                        parentIndex: { type: "number", description: "For hierarchy: -1=root (principle), or index of parent item" }
                      },
                      required: ["type", "text"]
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
