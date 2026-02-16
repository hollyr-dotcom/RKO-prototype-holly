import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/serverAuth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const maxDuration = 120;

// Track tool calls to send back to client
type ToolCall = {
  toolName: string;
  args: Record<string, unknown>;
};

// ============================================
// TOOLS - Organized by purpose
// ============================================

// --- Conversation Tools ---
const askUserTool = tool({
  name: "askUser",
  description: "Ask the user 1-3 questions at once. Shows clickable button pills. NEVER write questions as plain text. Call this ONCE with ALL your questions — don't call it multiple times.",
  parameters: z.object({
    questions: z.array(z.object({
      question: z.string().describe("The question to ask"),
      suggestions: z.array(z.string()).min(2).max(4).describe("2-4 clickable answer options"),
    })).min(1).max(3).describe("Array of questions to ask (1-3). All shown sequentially without waiting."),
  }),
  execute: async ({ questions }) => {
    return JSON.stringify({ questions });
  },
});

const confirmPlanTool = tool({
  name: "confirmPlan",
  description: "Propose a plan for substantial work. After calling this, STOP and wait. When user approves, EXECUTE this plan - don't make a new one.",
  parameters: z.object({
    title: z.string().describe("What you're planning to create"),
    steps: z.array(z.string()).min(3).max(5).describe("The steps you'll take (3-5 high-level steps only)"),
    summary: z.string().describe("What the end result will look like"),
  }),
  execute: async ({ title, steps, summary }) => {
    return JSON.stringify({
      title,
      steps,
      summary,
      instruction: "STOP. When user approves, execute THIS plan with showProgress() - do not create another plan."
    });
  },
});

const requestFeedbackTool = tool({
  name: "requestFeedback",
  description: "Pause for user feedback during execution. ALWAYS include 'Continue' as the first option.",
  parameters: z.object({
    message: z.string().describe("What you've done and asking what's next"),
    suggestions: z.array(z.string()).min(2).max(4).describe("First option MUST be 'Continue'. Then alternatives like 'Add more detail', 'Adjust layout'"),
  }),
  execute: async ({ message, suggestions }) => {
    return JSON.stringify({ type: "feedback", message, suggestions });
  },
});

const showProgressTool = tool({
  name: "showProgress",
  description: "REQUIRED: Call this BEFORE starting each plan step. Shows which step you're working on.",
  parameters: z.object({
    stepNumber: z.number().describe("Which step number (1, 2, 3, etc)"),
    stepTitle: z.string().describe("The step title from the plan"),
    status: z.string().describe("What you're doing: 'starting' or 'completed'"),
  }),
  execute: async (args) => JSON.stringify(args),
});

const reviewCanvasTool = tool({
  name: "reviewCanvas",
  description: "Review your work after completing a section. Assess layout, completeness, and connections. The canvas state will be in the context - use this to decide if you need to adjust, add arrows, or reorganize before moving on.",
  parameters: z.object({
    section: z.string().describe("What section you're reviewing"),
    assessment: z.enum(["good", "needs-work", "incomplete"]).describe("Your assessment of the section"),
  }),
  execute: async ({ section, assessment }) => {
    return JSON.stringify({
      reviewed: section,
      assessment,
      instruction: "Check CANVAS STATE above. If needs-work or incomplete, use updateSticky/moveItem/createArrow to improve."
    });
  },
});

const checkpointTool = tool({
  name: "checkpoint",
  description: "Pause for user review. Your message explains the work - this is just a short CTA.",
  parameters: z.object({
    completed: z.string().describe("Short CTA starting with 'Review'. Examples: 'Review the sitemap', 'Review homepage layout', 'Review product pages'. Keep it natural."),
  }),
  execute: async (args) => JSON.stringify({ type: "checkpoint", ...args }),
});

const webSearchTool = tool({
  name: "webSearch",
  description: "Search the web for real-world information - current trends, statistics, examples, best practices, market data. Returns a summary and key findings you can use in your work.",
  parameters: z.object({
    query: z.string().describe("What to search for"),
    purpose: z.string().describe("What you're trying to learn"),
    maxResults: z.number().min(1).max(20).describe("How many results to fetch — use your judgment: 3-5 for quick lookups, 8-12 for broad research, up to 20 for comprehensive surveys"),
  }),
  execute: async ({ query, purpose, maxResults }) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return JSON.stringify({
          error: "No TAVILY_API_KEY configured",
          query,
          purpose,
          results: []
        });
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
          include_images: true,
          max_results: maxResults,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();

      // Format results for easy extraction
      const formattedResults = data.results?.map((r: { title: string; url: string; content: string }) =>
        `- ${r.title}: ${r.content?.slice(0, 300)}`
      ).join("\n") || "No results found";

      // Top-level images from Tavily (when include_images is true)
      const topImages: string[] = data.images || [];

      // Structured sources for createSources tool
      const sources = data.results?.map((r: { title: string; url: string; content: string; image?: string }, idx: number) => {
        // Prefer per-result image, fall back to top-level images array
        const image = r.image || topImages[idx] || "";
        return {
          title: r.title,
          url: r.url,
          description: r.content?.slice(0, 200),
          image,
        };
      }) || [];

      return JSON.stringify({
        query,
        purpose,
        summary: data.answer || "No summary available",
        keyFindings: formattedResults,
        sources,
        instruction: "NOW DO ALL THREE: 1) createSources() to show source cards, 2) Synthesize the 'so what' — create a document (for detailed findings), stickies (for key takeaways), or table (for comparisons) with what you learned, 3) Use these insights in later steps."
      });
    } catch (error) {
      return JSON.stringify({
        error: String(error),
        query,
        purpose,
        results: []
      });
    }
  },
});

const createSourcesTool = tool({
  name: "createSources",
  description: "Display web search results as visual bookmark cards in a frame on the canvas. Call this after webSearch() to show sources visually. Pass the sources array from webSearch results directly.",
  parameters: z.object({
    title: z.string().describe("Frame title, e.g. 'Research: competitor landscape'"),
    sources: z.array(z.object({
      title: z.string().describe("Page title from search results"),
      url: z.string().describe("URL of the source"),
      description: z.string().default("").describe("Snippet/description"),
      image: z.string().default("").describe("Image URL for thumbnail"),
    })).min(1).max(20).describe("Sources from webSearch results"),
  }),
  execute: async (args) => {
    return JSON.stringify({ created: "sources", ...args });
  },
});

// Helper to generate unique IDs for created items
const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// --- Canvas Creation Tools ---
const createStickyTool = tool({
  name: "createSticky",
  description: "Create a single post-it note (tldraw sticky note shape). ⚠️ ONLY for adding ONE sticky to existing content. For 2+ stickies, you MUST use createLayout(type:'sticky') instead - it handles positioning automatically. Never call this multiple times in sequence. Keep text SHORT: max 6-8 words. Stickies are labels, not paragraphs.",
  parameters: z.object({
    text: z.string().describe("SHORT text — max 6-8 words. A sticky is a label, not a document."),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    color: z.enum(["yellow", "blue", "green", "pink", "orange", "violet"]),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "sticky", id, ...args });
  },
});

const createTextTool = tool({
  name: "createText",
  description: "Create a text label for headers or annotations. Returns an ID you can reference.",
  parameters: z.object({
    text: z.string().describe("The text content"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "text", id, ...args });
  },
});

const createShapeTool = tool({
  name: "createShape",
  description: "⚠️ ONLY for adding a SINGLE shape. For 2+ shapes (diagrams, org charts, flows), you MUST use createLayout() with type:'hierarchy' or type:'flow' - it creates shapes with automatic arrows!",
  parameters: z.object({
    type: z.enum(["rectangle", "ellipse", "triangle", "diamond"]),
    text: z.string().default("").describe("Label text inside the shape"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().describe("Width (typically 150-200 for diagram nodes)"),
    height: z.number().describe("Height (typically 80-100 for diagram nodes)"),
    color: z.enum(["black", "blue", "green", "red", "orange", "yellow", "violet"]),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "shape", id, ...args });
  },
});

const createFrameTool = tool({
  name: "createFrame",
  description: "Create a frame to group related content. Use frames to create sections for each plan step. Place content INSIDE the frame bounds. Returns an ID.",
  parameters: z.object({
    name: z.string().describe("Frame label (shown above frame)"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().describe("Frame width (typically 400-600)"),
    height: z.number().describe("Frame height (typically 500-800)"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "frame", id, ...args });
  },
});

const createArrowTool = tool({
  name: "createArrow",
  description: "Create an arrow to CONNECT shapes! Essential for flowcharts, org charts, sitemaps, process diagrams. Shows hierarchy, flow, relationships. Use liberally to make diagrams meaningful! Returns an ID.",
  parameters: z.object({
    startX: z.number().describe("Start X (typically center-bottom of source shape)"),
    startY: z.number().describe("Start Y"),
    endX: z.number().describe("End X (typically center-top of target shape)"),
    endY: z.number().describe("End Y"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "arrow", id, ...args });
  },
});

const createWorkingNoteTool = tool({
  name: "createWorkingNote",
  description: "Create a visible 'working note' on the canvas to show your current thinking or focus. Use this to make your process visible to the user. Returns an ID.",
  parameters: z.object({
    title: z.string().describe("What you're working on"),
    content: z.string().describe("Your current thinking or notes"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "workingNote", id, ...args });
  },
});

const createDocumentTool = tool({
  name: "createDocument",
  description: "Create a rich text document on the canvas. Use for written content: briefs, specs, guidelines, summaries. NOT for quick notes (use stickies) or tabular data (use createDataTable). ALWAYS provide meaningful content — never create empty documents. Default size: 780×660. Space items left-to-right with 50px gaps.",
  parameters: z.object({
    title: z.string().describe("Document title"),
    content: z.string().describe("Document body as HTML. Use <h2>, <p>, <ul>/<li>, <strong>, <em>. Example: '<h2>Overview</h2><p>This project...</p>'"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "document", id, ...args });
  },
});

const updateDocumentTool = tool({
  name: "updateDocument",
  description: "Replace the content of an existing document on the canvas. Get the document's ID from [CANVAS STATE]. Use HTML formatting.",
  parameters: z.object({
    itemId: z.string().describe("The shape ID of the document to update (from canvas state)"),
    content: z.string().describe("New document body as HTML"),
  }),
  execute: async (args) => JSON.stringify({ updated: "document", ...args }),
});

const createDataTableTool = tool({
  name: "createDataTable",
  description: "Create an interactive data table on the canvas. Use for structured data: comparisons, feature matrices, RACI tables, timelines. NOT for simple lists (use stickies) or prose (use createDocument). ALWAYS fill ALL cells with meaningful data — never leave cells empty. Default size: 700×460. Space items left-to-right with 50px gaps.",
  parameters: z.object({
    title: z.string().describe("Table title"),
    columns: z.array(z.string()).min(1).max(8).describe("Column header names"),
    rows: z.array(z.array(z.string())).describe("Row data — each inner array must match the number of columns"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "datatable", id, ...args });
  },
});

// --- Layout Tool (REQUIRED for multiple items) ---
const createLayoutTool = tool({
  name: "createLayout",
  description: `Creates organized visual items (stickies or shapes) in a frame. Use for brainstorms, idea lists, diagrams, and flows.

⚠️ DON'T use createLayout for written content (briefs, specs, summaries) → use createDocument instead.
⚠️ DON'T use createLayout for tabular data (comparisons, matrices, roles) → use createDataTable instead.

WHEN TO USE THIS TOOL:
- Brainstorms, idea lists, quick notes → type:"sticky" with "grid" layout
- Diagrams, org charts, sitemaps, flows → type:"shape" with "hierarchy" or "flow" layout

⚠️ STICKY NOTE TEXT RULES:
- Each sticky: MAX 6-8 words. Think post-it note, not paragraph.
- GOOD: "Automate CI/CD pipeline" — BAD: "Principle: Reliability enables speed. What it looks like: automate tests, CI/CD, monitoring."
- Need more detail? Use HIERARCHY: parent sticky with short title → child stickies with details.
- Or use multiple stickies in a grid — one idea per sticky.
- If content needs sentences/paragraphs, use createDocument instead.

The layout engine handles all positioning. Items are aligned in a grid or tree structure.
NEVER use createSticky/createShape multiple times — use this instead for 2+ items.`,
  parameters: z.object({
    type: z.enum(["grid", "hierarchy", "flow"]).describe("Layout type"),
    frameName: z.string().describe("Name for the frame"),
    items: z.array(z.object({
      type: z.enum(["sticky", "shape", "text"]).describe("Item type"),
      text: z.string().describe("Content text. For stickies: MAX 6-8 words — short labels, not sentences."),
      color: z.string().default("yellow").describe("Color: yellow, blue, green, pink, orange, violet"),
      parentIndex: z.number().default(-1).describe("For hierarchy: index of parent item (0-based), -1 for root"),
    })).min(1).max(20).describe("Items to place in the layout"),
    columns: z.number().default(3).describe("For grid: number of columns"),
    direction: z.enum(["down", "right"]).default("down").describe("For hierarchy: tree direction"),
    spacing: z.enum(["compact", "normal", "spacious"]).default("normal").describe("Spacing between items"),
  }),
  execute: async (args) => {
    return JSON.stringify({
      layout: {
        ...args,
        options: {
          columns: args.columns,
          direction: args.direction,
          spacing: args.spacing,
        }
      }
    });
  },
});

// --- Canvas Modification Tools ---
const deleteItemTool = tool({
  name: "deleteItem",
  description: "Delete an item from the canvas by its ID. Use when user wants to remove something.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the item to delete"),
    reason: z.string().describe("Why you're deleting this"),
  }),
  execute: async (args) => {
    return JSON.stringify({ deleted: args.itemId, reason: args.reason });
  },
});

const updateStickyTool = tool({
  name: "updateSticky",
  description: "Update the text or color of an existing sticky note.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the sticky to update"),
    newText: z.string().describe("The new text content"),
    newColor: z.enum(["yellow", "blue", "green", "pink", "orange", "violet"]).describe("The color (use same color to keep unchanged)"),
  }),
  execute: async (args) => {
    return JSON.stringify({ updated: args.itemId, ...args });
  },
});

const moveItemTool = tool({
  name: "moveItem",
  description: "Move an existing shape/sticky to a new position. CRITICAL: Use this when user asks to rearrange, reorganize, reposition, or move items. Get the item ID from [CANVAS STATE]. This edits existing content rather than creating new content.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the existing item to move (get from canvas state)"),
    x: z.number().describe("New X position"),
    y: z.number().describe("New Y position"),
  }),
  execute: async (args) => {
    return JSON.stringify({ moved: args.itemId, x: args.x, y: args.y });
  },
});

const organizeIntoFrameTool = tool({
  name: "organizeIntoFrame",
  description: "Move existing items into a frame. Use when user says 'organize these', 'put these in a frame', 'group these', 'rearrange'. This MOVES existing items - it does NOT create duplicates. Get item IDs from [CANVAS STATE].",
  parameters: z.object({
    frameName: z.string().describe("Name for the frame"),
    itemIds: z.array(z.string()).describe("IDs of existing items to move into the frame (from canvas state)"),
    layout: z.enum(["row", "column", "grid"]).describe("How to arrange items inside the frame").default("row"),
  }),
  execute: async (args) => {
    return JSON.stringify(args);
  },
});

// --- Workspace Navigation Tools ---
const createCanvasTool = tool({
  name: "createCanvas",
  description: "Create a new canvas (board). Use when the user wants to start fresh work on a new board, or when you need a dedicated space for a task. YOU decide whether to navigate the user there — navigate=true for 'create a board for X', navigate=false for background creation.",
  parameters: z.object({
    name: z.string().describe("Canvas name (short, descriptive)"),
    spaceId: z.string().default("").describe("Space to create in (empty for unassigned). Check workspace context for available spaces."),
    navigate: z.boolean().default(true).describe("Whether to take the user to the new canvas after creation"),
  }),
  execute: async ({ name, spaceId, navigate }) => {
    const canvasesPath = path.join(process.cwd(), "src/data/canvases.json");
    const canvases = JSON.parse(fs.readFileSync(canvasesPath, "utf-8"));
    const now = new Date().toISOString();
    const newCanvas = {
      id: `canvas-${Date.now()}`,
      spaceId: spaceId || "",
      name,
      createdAt: now,
      updatedAt: now,
    };
    canvases.push(newCanvas);
    fs.writeFileSync(canvasesPath, JSON.stringify(canvases, null, 2) + "\n");

    return JSON.stringify({
      created: "canvas",
      canvasId: newCanvas.id,
      spaceId: newCanvas.spaceId,
      name: newCanvas.name,
      navigate,
    });
  },
});

const navigateToCanvasTool = tool({
  name: "navigateToCanvas",
  description: "Navigate the user to an existing canvas. Use when user asks to go to a specific board, or when you need to work on content that lives on another board. Check workspace context for available canvases and their IDs.",
  parameters: z.object({
    canvasId: z.string().describe("The canvas ID to navigate to"),
    reason: z.string().describe("Brief reason for navigating (shown to user)"),
  }),
  execute: async ({ canvasId, reason }) => {
    return JSON.stringify({
      action: "navigate",
      canvasId,
      reason,
    });
  },
});

// ============================================
// AGENT CONFIGURATION
// ============================================

// Planning agent - has confirmPlan tool for creating plans
const planningAgent = new Agent({
  name: "Canvas Assistant",
  model: "gpt-5.2",
  instructions: `You're a friendly workspace assistant. You help people create visual artifacts on canvases (whiteboards) and navigate their workspace.

FIRST: DECIDE HOW TO RESPOND based on what the user asked:

1. JUST REPLY (no tools) — for simple/conversational requests:
   - "What can you do?" → Brief, friendly answer (2-3 sentences)
   - "Thanks" / "Cool" → Short acknowledgment
   - General questions not about creating canvas content
   - Keep replies short and conversational (1-3 sentences max)

2. RESEARCH + REPLY (webSearch, then text) — for info requests:
   - "What's the weather?" → search, then summarize
   - "What are the latest trends in X?" → search, then summarize
   - Questions that need facts but don't need canvas artifacts

3. QUESTIONS + PLAN (askUser, then confirmPlan in SEPARATE turns) — for complex canvas creation:
   - "Create a project kickoff" → needs scope, format, details
   - "Design a user flow for checkout" → needs context
   - "Build a competitive analysis" → needs industry, competitors
   - NEVER ask which board or space to use — the system handles that automatically
   - Only use this for substantial, multi-step canvas work

   🚨 CRITICAL TWO-STEP PROCESS:
   STEP 1: If you need clarification, call askUser() with 1-2 questions, then STOP. DO NOT call confirmPlan() in the same turn.
   STEP 2: After user answers your questions, THEN call confirmPlan() in your NEXT response.

   ⚠️ NEVER call askUser() AND confirmPlan() in the same turn!

WORKSPACE NAVIGATION:
- Check [WORKSPACE CONTEXT] to see where the user is (home, space, or canvas) and what canvases exist.
- If user is on the HOME PAGE and asks for canvas work → use createCanvas() to make a new board, then start working on it.
- If user is on a CANVAS and asks for a NEW board / fresh board → use createCanvas(navigate=true) to create and navigate to it, then start working.
- If user mentions a specific board by name → use navigateToCanvas() to go there first.
- NEVER ask "which board should I use?" — decide based on context. Create a new one if none fits.
- After createCanvas(navigate=true), the user will be taken to the new board and you can start placing content.

USE YOUR JUDGMENT. The key question: "Does this need visual artifacts on the canvas?"
- Yes, and it's complex → ask questions (if needed), WAIT for answers, THEN create plan
- Yes, but it's simple → just do it (you'll be handed to execution)
- No → just reply with text

WHEN ASKING QUESTIONS (only for complex canvas tasks):
- Call askUser() ONCE with ALL your questions (1-2 questions) in the questions array
- NEVER call askUser() multiple times — batch all questions into one call
- After calling askUser(), STOP and WAIT for the user to answer
- DO NOT call confirmPlan() yet — wait for their response first

WHEN CREATING PLAN (only AFTER user has answered your questions):
- Only call confirmPlan() if you've already received answers to your questions OR if no questions were needed
- IMPORTANT: When calling confirmPlan(), also write a brief contextual 1-sentence message. Vary it based on what you're building — e.g. "Great, let me put together the kickoff board", "I'll map out the user flow for you", "Let me sketch this out". Don't just say "Here's the plan:" every time.
- NEVER list the plan steps in your text message — the plan UI shows them. Keep your message to 1 short sentence only.

PLAN STEP FORMAT - KEEP IT SHORT BUT CLEAR:
- Each step should be 3-8 words max
- Use verbs that hint at the right format:
  - "Write" / "Draft" → will become a document
  - "Compare" / "Track" / "List" (tabular) → will become a table
  - "Research" / "Find" / "Look up" → web research + synthesis (see below)
  - "Brainstorm" / "Ideate" → will become stickies
  - "Map" / "Chart" / "Diagram" → will become a diagram
- GOOD: "Draft project brief", "Research competitor landscape", "Compare features", "Brainstorm risks"
- BAD: "Create a homepage wireframe frame and lay out all the main sections"

RESEARCH IN PLANS — THE "SO WHAT" MATTERS!
Research is only valuable if you extract insights from it. A research step should always produce something actionable — not just links.

When to include research:
- User mentions a real topic, industry, company, or product
- A step would benefit from real-world data, examples, or best practices
DON'T search for purely creative/layout tasks (wireframes, brainstorms, org charts)

Research steps should IMPLY synthesis — the step title hints at what you'll extract:
- "Research review frameworks" → you'll search, show sources, AND synthesize key takeaways
- "Analyze competitor landscape" → you'll search, show sources, AND create a comparison
The later steps in the plan should BUILD ON what research uncovered — reference insights, use real data.

CANVAS: Check [CANVAS STATE] for existing content and positions.

FOR SIMPLE, DIRECT REQUESTS - USE TOOLS IMMEDIATELY:
- "Create stickies about X" → Use createLayout(type:"sticky") for post-it notes! NOT shapes.
- "Brainstorm ideas for Y" → Use createLayout(type:"sticky") for sticky notes
- "Add a frame for Z" → Just use createFrame() directly
- "Draw an arrow from A to B" → Just use createArrow() directly
- No need for confirmPlan() — just do it!

🎨 YOUR TEXT MESSAGES — BE NATURAL, NEVER ROBOTIC:
The chat UI auto-generates artifact cards (board name, item count, navigation arrows) for everything you create. Your text adds personality — NOT data the cards already show.

🚨 CRITICAL OUTPUT ORDER — YOU MUST FOLLOW THIS:
1. FIRST: Write a brief acknowledgment (1 sentence) — this shows ABOVE the artifact cards
2. THEN: Call your tools (createCanvas, createLayout, etc.)
3. LAST: Write a DIFFERENT follow-up (1 sentence) — this shows BELOW the artifact cards

NEVER call tools before writing your acknowledgment text. The UI depends on this order.
NEVER repeat your acknowledgment after the tools. The summary MUST be different content — a follow-up question, highlight, or next step.

- Acknowledgment examples: "Ooh, funny cat names — on it!" / "Bird puns incoming." / "Fresh brainstorm board coming up."
- Follow-up examples (MUST differ from ack): "Want me to organize these by category?" / "Some standouts: Chairman Meow, Purrlock Holmes."

NEVER use "---" separators in your text.

🚫 BANNED PATTERNS (the cards handle this info — NEVER repeat it in text):
- "Created a new board called **X**"
- "...and added a grid of Y stickies (e.g., **A, B, C**)."
- Mentioning board names, item counts, or tool names in your prose
- Using the same sentence structure twice across different requests

🎯 CHOOSING THE RIGHT FORMAT — MIX THEM!
A great canvas uses MULTIPLE formats. Don't just spam stickies — pick the best tool for each piece of content:

📝 createDocument — for WRITTEN CONTENT:
  - Briefs, specs, guidelines, summaries, research findings, strategy docs
  - Anything longer than a few bullet points
  - "Create a project brief" → document, not stickies

📊 createDataTable — for STRUCTURED DATA:
  - Comparisons, feature matrices, competitive analysis, tracking tables
  - Anything with rows and columns
  - "Compare these options" → table, not stickies

📌 createLayout(type:"sticky") — for QUICK IDEAS:
  - Brainstorms, idea lists, feedback, tags, categories
  - Short items that benefit from visual clustering
  - User explicitly says "stickies", "post-its", "brainstorm"
  - ⚠️ Each sticky = max 6-8 words. A sticky is a label, NOT a paragraph.
  - Need detail? Use hierarchy (parent title → child details) or more stickies.

🔲 createLayout(type:"shape") — for DIAGRAMS:
  - Org charts, sitemaps, flows, hierarchies, process maps
  - When items need connecting arrows

PLAN EXAMPLES:
"Create a project kickoff board":
  Step 1: Draft project brief ← createDocument
  Step 2: Map team structure ← createLayout(type:"hierarchy")
  Step 3: Create timeline table ← createDataTable
  Step 4: Brainstorm risks ← createLayout(type:"sticky")

"Prep for quarterly review":
  Step 1: Research review best practices ← webSearch + createSources + synthesize key insights
  Step 2: Draft impact summary ← createDocument (use research findings!)
  Step 3: Create metrics table ← createDataTable
  Step 4: Brainstorm learnings ← createLayout(type:"sticky")

"Build a competitive analysis":
  Step 1: Research competitor landscape ← webSearch + createSources + synthesize findings
  Step 2: Compare competitors ← createDataTable (populate with REAL data from research)
  Step 3: Map strategic implications ← createLayout(type:"sticky")

FOR COMPLEX, MULTI-STEP WORK - USE PLAN:
- Multiple sections/frames with dependencies
- Requires research or multiple layouts
- User asks for something substantial ("create a project kickoff", "design a user flow")
- Then use confirmPlan() to get approval before execution`,
  tools: [
    askUserTool,
    confirmPlanTool,
    webSearchTool,
    // Workspace navigation tools
    createCanvasTool,
    navigateToCanvasTool,
    // Canvas creation tools for simple direct requests
    createLayoutTool,
    createStickyTool,
    createTextTool,
    createShapeTool,
    createFrameTool,
    createArrowTool,
    updateStickyTool,
    moveItemTool,
    deleteItemTool,
    organizeIntoFrameTool,
    createDocumentTool,
    updateDocumentTool,
    createDataTableTool,
    createSourcesTool,
  ],
});

// Execution agent - NO confirmPlan tool, can only execute
const executionAgent = new Agent({
  name: "Canvas Executor",
  model: "gpt-5.2",
  instructions: `You are executing an approved plan. Create canvas items step by step.

🚨 CRITICAL RULE #1: EDIT EXISTING CONTENT, DON'T RECREATE! 🚨
When user asks to "rearrange", "reorganize", "move", "edit", "change layout", "adjust", "reposition", "put in a frame", "organize":

YOU MUST:
1. Check [CANVAS STATE] section below to see what's already there
2. Find the [ID: xxx] for each existing item
3. Use moveItem(itemId, newX, newY) for EACH existing item
4. If creating a frame, moveItem AFTER creating the frame to move items inside

YOU MUST NOT:
- Create new stickies/shapes with the same text as existing ones
- Use createLayout() when items already exist - that duplicates content!
- Ignore existing canvas items

EXAMPLE - User says "put these in a frame":
✓ CORRECT: createFrame() → moveItem(existingId1, ...) → moveItem(existingId2, ...)
✗ WRONG: createLayout() with new stickies

Check [CANVAS STATE] carefully. Use the IDs you see there!

🚨 CRITICAL RULE #2: WHEN USER SAYS "CONTINUE", YOU MUST CONTINUE! 🚨
If the last user message is "Continue" or similar, you MUST immediately:
1. Call showProgress() for the next step
2. Execute that step
3. Keep going until done

NEVER respond with just text when user says "Continue" - START WORKING IMMEDIATELY!

⚠️ CRITICAL RULE #3: NEVER call createSticky or createShape multiple times!
If you need 2+ items, you MUST use createLayout() instead.

WORKSPACE NAVIGATION:
- Check [WORKSPACE CONTEXT]. If you're on the HOME PAGE, call createCanvas(navigate=true) FIRST before any canvas tools.
- If user asked for a NEW board, call createCanvas(navigate=true) FIRST, even if already on a canvas.
- After createCanvas, the user is navigated automatically — then start placing content.

EXECUTION FLOW:
Work through steps in sequence. For each step:
1. Call showProgress(stepNumber, "step title", "starting")
2. Pick the RIGHT tool for this step's content:
   - Written content (brief, spec, summary)? → createDocument
   - Tabular data (comparison, matrix, timeline)? → createDataTable
   - Quick ideas, brainstorm items? → createLayout(type:"sticky")
   - Diagram, flow, hierarchy? → createLayout(type:"shape"/"hierarchy"/"flow")
3. Call showProgress(stepNumber, "step title", "completed")
4. Continue to next step

⚠️ DO NOT use createLayout for everything! Read the step title and think about what format serves the content best.

/* CHECKPOINTS DISABLED — keeping instructions for later re-enable:
CHECKPOINTS - PAUSE AT MILESTONES:
- Call checkpoint() after completing 3-4 related steps
- After a checkpoint, STOP and wait for user to click "Continue"
- When user clicks "Continue", IMMEDIATELY resume from next step

YOUR MESSAGE BEFORE CHECKPOINT:
- Brief (1 sentence): "Here's the wireframes so far—take a look."

CHECKPOINT LABEL:
- Format: "Review [what you created]"
*/

=====================================================
🎯 CHOOSING THE RIGHT TOOL — READ THIS FIRST!
=====================================================
Before creating ANYTHING, ask yourself: what format best serves this content?

📝 createDocument — WRITTEN CONTENT (briefs, specs, summaries, guidelines):
Step says "brief", "spec", "summary", "guidelines", "overview", "one-pager", "draft"?
→ Use createDocument, NOT stickies!

Example — step "Draft kickoff brief":
createDocument({
  title: "Product Kickoff Brief",
  content: "<h2>Problem</h2><p>Users struggle to find relevant content, leading to 40% drop-off after onboarding.</p><h2>Proposed Solution</h2><p>A personalized feed that surfaces content based on role, team, and past activity.</p><h2>Success Metrics</h2><ul><li>Increase activation by 15%</li><li>Reduce churn by 10%</li></ul><h2>Timeline</h2><p>Design: 2 weeks · Build: 4 weeks · QA: 1 week</p>",
  x: 0, y: 0
})

📊 createDataTable — TABULAR/STRUCTURED DATA (comparisons, matrices, roles, timelines):
Step says "compare", "track", "roles", "timeline", "matrix", "table", "RACI"?
→ Use createDataTable, NOT stickies!

Example — step "Map roles & responsibilities":
createDataTable({
  title: "RACI Matrix",
  columns: ["Task", "Responsible", "Accountable", "Consulted", "Informed"],
  rows: [
    ["Define requirements", "PM", "Director", "Design, Eng", "Stakeholders"],
    ["Design specs", "Design lead", "PM", "Engineering", "QA"],
    ["Implementation", "Eng lead", "PM", "Design", "QA"],
    ["QA & testing", "QA lead", "Eng lead", "Design", "PM"]
  ],
  x: 0, y: 0
})

📌 createLayout(type:"sticky") — QUICK IDEAS (brainstorms, risks, feedback, categories):
Step says "brainstorm", "ideate", "risks", "ideas", "feedback"?
→ Stickies are perfect here
⚠️ KEEP STICKIES SHORT: Max 6-8 words each. One idea per sticky.
- GOOD: "Tight feedback loops" — BAD: "Principle: Tight feedback loops. What it looks like: prototypes, feature flags, A/B tests."
- Need detail? Use HIERARCHY layout — parent sticky for the category, child stickies for details.
- If a sticky needs a sentence, it should be a document instead.

📌 createLayout(type:"shape"/"hierarchy"/"flow") — DIAGRAMS (org charts, flows, sitemaps):
Step says "map", "chart", "flow", "diagram", "hierarchy"?
→ Use shapes with arrows

🔍 webSearch + createSources + SYNTHESIS — RESEARCH (competitive analysis, best practices, trends):
Step says "research", "find", "look up", "competitive analysis", "best practices"?
A research step has THREE parts — sources are useless without the "so what":
1. Call webSearch() to find real information
2. Call createSources() to show the source cards on canvas
3. SYNTHESIZE what you learned — pick the format that fits:
   - Key takeaways / principles? → createLayout(type:"sticky") with the insights
   - Detailed findings / summary? → createDocument with structured analysis
   - Comparison data? → createDataTable with real data from results
Use your judgment — what would be most useful for this specific task?
The synthesis is the POINT of research. Links alone are not helpful.
CRITICAL: Carry research findings into later steps. Reference real data, real examples, real insights.

POSITIONING — USE x:0, y:0 FOR EVERYTHING:
The canvas has automatic collision detection that places items left-to-right.
Just use x:0, y:0 for every tool call — items will never overlap.

=====================================================
createLayout() REFERENCE — for stickies and diagrams only
=====================================================

FRAME NAMING:
- Use descriptive names: "Homepage sections", "Product details"
- DON'T include step numbers: "Step 2 — Homepage" ✗
- DO use clear labels: "Homepage wireframe" ✓

HIERARCHY example (org charts, principles):
createLayout({
  type: "hierarchy",
  frameName: "Design Principles",
  items: [
    { type: "shape", text: "Principle 1", color: "blue", parentIndex: -1 },
    { type: "shape", text: "Description...", color: "light-blue", parentIndex: 0 },
  ]
})

FLOW example (processes, journeys):
createLayout({
  type: "flow",
  frameName: "Checkout Flow",
  items: [
    { type: "shape", text: "Cart", color: "blue" },
    { type: "shape", text: "Payment", color: "yellow" },
    { type: "shape", text: "Done", color: "green" }
  ]
})

GRID + STICKIES example (brainstorms, ideas):
createLayout({
  type: "grid",
  frameName: "Key Risks",
  items: [
    { type: "sticky", text: "Tight deadline", color: "orange" },
    { type: "sticky", text: "Need extra dev", color: "orange" },
    { type: "sticky", text: "Scope creep", color: "yellow" },
    { type: "sticky", text: "Tech debt", color: "yellow" },
  ],
  columns: 3
})
⚠️ Each sticky is 2-4 words — like a real post-it note. NEVER put paragraphs on stickies.

HIERARCHY example (when you need categories + details):
createLayout({
  type: "hierarchy",
  frameName: "Key Principles",
  items: [
    { type: "sticky", text: "Feedback loops", color: "blue", parentIndex: -1 },
    { type: "sticky", text: "Ship prototypes fast", color: "yellow", parentIndex: 0 },
    { type: "sticky", text: "A/B test everything", color: "yellow", parentIndex: 0 },
    { type: "sticky", text: "Reliability", color: "blue", parentIndex: -1 },
    { type: "sticky", text: "Automate CI/CD", color: "yellow", parentIndex: 3 },
    { type: "sticky", text: "Monitor in prod", color: "yellow", parentIndex: 3 },
  ]
})

COLOR GUIDELINES - USE WITH RESTRAINT:
⚠️ IMPORTANT: Use color intentionally, not randomly!

WITHIN EACH FRAME/SECTION:
- Stick to 2-3 colors maximum per frame
- Use ONE main color for most items
- Use accent colors only for hierarchy or emphasis
- Example: Homepage wireframe → all blue shapes (not rainbow)
- Example: Feature ideas → all yellow stickies (not mixed colors)

ACROSS DIFFERENT FRAMES:
- Different frames CAN use different color palettes
- Example: Frame 1 uses blue/green, Frame 2 uses yellow/orange
- This helps visually separate different sections

FOR HIERARCHY:
- Parent nodes: one color (e.g., blue for all leadership)
- Child nodes: another color (e.g., green for all team members)
- Don't use a different color for every single item

GOOD: 10 yellow stickies for features, 3 blue stickies for constraints
BAD: 13 stickies each with random different colors`,
  tools: [
    showProgressTool,
    reviewCanvasTool,
    // checkpointTool, // disabled — re-enable when checkpoints are needed
    requestFeedbackTool,
    webSearchTool,
    // Workspace navigation tools
    createCanvasTool,
    navigateToCanvasTool,
    // Canvas creation tools
    createLayoutTool,  // PREFERRED for organized content
    createStickyTool,
    createTextTool,
    createShapeTool,
    createFrameTool,
    createArrowTool,
    createWorkingNoteTool,
    deleteItemTool,
    updateStickyTool,
    moveItemTool,
    organizeIntoFrameTool,
    createDocumentTool,
    updateDocumentTool,
    createDataTableTool,
    createSourcesTool,
  ],
});

// ============================================
// API HANDLER
// ============================================

export async function POST(req: Request) {
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, canvasState, userEdits, generateTitle, workspaceContext } = await req.json();
  console.log('[Chat API] generateTitle:', generateTitle, 'messages.length:', messages?.length);

  // Build conversation context - include tool calls so agent knows what it proposed
  type MessageWithTools = {
    role: string;
    content: string;
    toolInvocations?: Array<{ toolName: string; args: Record<string, unknown> }>;
  };

  // Find if there's an approved plan we should be executing
  let approvedPlan: { title: string; steps: string[] } | null = null;
  let approvalMessageIndex = -1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i] as MessageWithTools;
    const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
    if (planTool) {
      const args = planTool.args as { title: string; steps: string[]; summary: string };
      // Check if next user message is approval
      const nextMsg = messages[i + 1];
      if (nextMsg?.role === 'user' && nextMsg.content?.toLowerCase().includes('approve')) {
        approvedPlan = { title: args.title, steps: args.steps };
        approvalMessageIndex = i + 1;
      }
    }
  }

  // If there's an approved plan, use a completely different execution-only prompt
  let conversationContext = "";
  let isExecutionMode = false;

  if (approvedPlan) {
    // EXECUTION MODE: Track completed steps and continue from where we left off

    // Find completed steps by looking at showProgress("completed") and checkpoint calls
    const completedSteps: number[] = [];
    let hasCheckpoint = false;

    for (let i = approvalMessageIndex; i < messages.length; i++) {
      const msg = messages[i] as MessageWithTools;
      if (msg.toolInvocations) {
        msg.toolInvocations.forEach(t => {
          if (t.toolName === 'showProgress') {
            const args = t.args as { stepNumber: number; status: string };
            if (args.status === 'completed' && !completedSteps.includes(args.stepNumber)) {
              completedSteps.push(args.stepNumber);
            }
          }
          if (t.toolName === 'checkpoint') {
            hasCheckpoint = true;
          }
        });
      }
    }

    const nextStep = completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;
    const totalSteps = approvedPlan.steps.length;
    // Plan is complete if all steps marked done OR a checkpoint was called (AI wraps up)
    const isComplete = nextStep > totalSteps || hasCheckpoint;

    // If the plan is complete and the latest user message is a NEW request
    // (not "Continue" or the approval itself), exit execution mode entirely
    if (isComplete) {
      const latestUserMsg = messages[messages.length - 1];
      const isNewRequest = latestUserMsg?.role === 'user'
        && !latestUserMsg.content?.toLowerCase().includes('approve')
        && latestUserMsg.content?.toLowerCase() !== 'continue';
      if (isNewRequest) {
        approvedPlan = null;
      }
    }

    if (approvedPlan) {
      // Still in execution mode (plan not complete, or user said "Continue")
      isExecutionMode = true;

      // Build context with clear state
      conversationContext = `EXECUTION MODE - Continuing approved plan.

Plan: "${approvedPlan.title}"
${approvedPlan.steps.map((s, i) => {
  const stepNum = i + 1;
  const status = completedSteps.includes(stepNum) ? '✓ DONE' : (stepNum === nextStep ? '→ DO NOW' : '  pending');
  return `${status} Step ${stepNum}: ${s}`;
}).join('\n')}

${isComplete ? `
ALL STEPS COMPLETE!
1. Write a brief message like "All set!" or "Done!" (1-2 words max)
2. You're done — no need to pause

Keep your message VERY brief - the card shows details.
` : `
🚨 USER CLICKED "CONTINUE" - START WORKING NOW! 🚨

NEXT STEP IS ${nextStep}: "${approvedPlan.steps[nextStep - 1]}"

DO THIS IMMEDIATELY:
1. showProgress(${nextStep}, "${approvedPlan.steps[nextStep - 1]}", "starting")
2. Pick the RIGHT tool for this step's content:
   - Written content (brief, overview, spec, summary)? → createDocument
   - Tabular data (roles, comparison, timeline, matrix)? → createDataTable
   - Research? → webSearch + createSources + SYNTHESIZE (see below)
   - Brainstorm ideas, quick notes? → createLayout(type:"sticky")
   - Diagram, flow, hierarchy? → createLayout(type:"shape"/"hierarchy")
3. showProgress(${nextStep}, "${approvedPlan.steps[nextStep - 1]}", "completed")
4. Continue to step ${nextStep + 1}

RESEARCH STEPS — always extract the "so what":
If this step involves research, do ALL THREE in this step:
  a) webSearch() → get real information
  b) createSources() → display source cards
  c) Synthesize findings — create a doc, stickies, or table with what you learned
     Pick format based on what's useful: takeaways → stickies, detailed analysis → document, comparison → table
Then carry those insights into later steps — use real data, cite real examples.

DO NOT write explanatory text first - CALL showProgress() IMMEDIATELY!`}`;
    }
  }

  if (!approvedPlan) {
    // Normal mode: build conversation context
    // Count how many questions have already been asked
    let questionsAsked = 0;
    let lastMessageHadQuestions = false;

    messages.forEach((m: MessageWithTools, index: number) => {
      if (m.toolInvocations?.some(t => t.toolName === 'askUser')) {
        questionsAsked++;
        // Check if this was the last assistant message
        if (index === messages.length - 1 && m.role === 'assistant') {
          lastMessageHadQuestions = true;
        }
      }
    });

    conversationContext = messages
      .map((m: MessageWithTools) => {
        let text = `${m.role}: ${m.content}`;

        // Include confirmPlan details
        const planTool = m.toolInvocations?.find(t => t.toolName === 'confirmPlan');
        if (planTool) {
          const args = planTool.args as { title: string; steps: string[]; summary: string };
          text += `\n[PROPOSED PLAN: "${args.title}" - Steps: ${args.steps.join(', ')}]`;
        }

        return text;
      })
      .join("\n");

    // Guard against calling askUser() twice
    if (questionsAsked >= 1 && !lastMessageHadQuestions) {
      conversationContext += `\n\n🛑 YOU ALREADY ASKED QUESTIONS. DO NOT call askUser() again. Call confirmPlan() NOW or just reply with text.`;
    }

    // Guard against calling confirmPlan() immediately after askUser()
    if (lastMessageHadQuestions) {
      conversationContext += `\n\n🚨 YOU JUST ASKED QUESTIONS IN YOUR LAST MESSAGE. STOP AND WAIT FOR USER'S ANSWERS. DO NOT call confirmPlan() yet — the user needs to respond to your questions first!`;
    }
  }

  // Include canvas state if provided (structured format with frames, orphans, arrows)
  type ShapeInfo = {
    id: string;
    type: string;
    text?: string;
    color?: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    createdBy: string;
  };
  type FrameInfo = ShapeInfo & { children: ShapeInfo[]; arrows: ShapeInfo[] };
  type StructuredCanvas = { frames: FrameInfo[]; orphans: ShapeInfo[]; arrows: ShapeInfo[]; focusedShapeId?: string | null };

  const canvas = canvasState as StructuredCanvas | undefined;
  const hasContent = canvas && (canvas.frames.length > 0 || canvas.orphans.length > 0);

  if (hasContent) {
    // Calculate bounding box across all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const updateBounds = (s: ShapeInfo) => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    };
    canvas.frames.forEach(f => { updateBounds(f); f.children.forEach(updateBounds); });
    canvas.orphans.forEach(updateBounds);

    // Build hierarchical description
    const tag = (s: ShapeInfo) => s.createdBy === "ai" ? "AI" : "user";
    const shapeDesc = (s: ShapeInfo) =>
      `    - [ID: ${s.id}] "${s.text?.slice(0, 50) || 'no text'}" (${s.type}, ${s.color || 'default'}, ${tag(s)})`;

    let canvasDescription = "";

    canvas.frames.forEach(frame => {
      canvasDescription += `\n  Frame "${frame.name || 'Untitled'}" (${tag(frame)}):`;
      frame.children.forEach(child => {
        canvasDescription += `\n${shapeDesc(child)}`;
      });
      if (frame.arrows.length > 0) {
        canvasDescription += `\n    Connections: ${frame.arrows.length} arrows`;
      }
    });

    if (canvas.orphans.length > 0) {
      canvasDescription += `\n  Loose items (not in any frame):`;
      canvas.orphans.forEach(s => {
        canvasDescription += `\n${shapeDesc(s)}`;
      });
    }

    const totalItems = canvas.frames.reduce((n, f) => n + 1 + f.children.length + f.arrows.length, 0)
      + canvas.orphans.length + canvas.arrows.length;

    conversationContext += `

[CANVAS STATE - ${totalItems} items already on canvas]
⚠️ THESE ITEMS ALREADY EXIST! Use their IDs with moveItem() if user asks to rearrange.

OCCUPIED AREA: x=${Math.round(minX)} to ${Math.round(maxX)}, y=${Math.round(minY)} to ${Math.round(maxY)}

⚠️ If adding NEW content, start here (pick one):
  → RIGHT SIDE: x=${Math.round(maxX + 100)}, y=${Math.round(minY)} (creates columns)
  → BELOW: x=${Math.round(minX)}, y=${Math.round(maxY + 100)} (creates rows)

EXISTING ITEMS (use these IDs with moveItem):
${canvasDescription}${canvas.focusedShapeId ? `

🔍 FOCUS MODE ACTIVE — The user is viewing item [ID: ${canvas.focusedShapeId}] in full-screen focus mode.
When the user says "add a column", "change X", "update this", etc., they mean THIS focused item.
Only target a different item if the user EXPLICITLY names another one.` : ""}`;
  } else {
    conversationContext += `

[CANVAS STATE - Empty]
Canvas is empty. Start placing content at (0, 0).`;
  }

  // Include workspace context
  type WorkspaceContext = {
    currentSurface: string;
    canvasId?: string;
    spaceId?: string;
    availableSpaces: Array<{ id: string; name: string }>;
    availableCanvases: Array<{ id: string; name: string; spaceId: string }>;
  };

  const workspace = workspaceContext as WorkspaceContext | undefined;
  if (workspace) {
    conversationContext += `

[WORKSPACE CONTEXT]
Current surface: ${workspace.currentSurface}${workspace.canvasId ? ` (canvas: ${workspace.canvasId})` : ''}${workspace.spaceId ? ` (space: ${workspace.spaceId})` : ''}

Available spaces:
${workspace.availableSpaces.map(s => `  - ${s.name} [ID: ${s.id}]`).join('\n') || '  (none)'}

Available canvases:
${workspace.availableCanvases.map(c => `  - "${c.name}" [ID: ${c.id}]${c.spaceId ? ` in space ${c.spaceId}` : ' (unassigned)'}`).join('\n') || '  (none)'}`;
  }

  // Include user edits and additions
  type UserEdit = { shapeId: string; field: string; oldValue: string; newValue: string };
  const edits = (userEdits as UserEdit[] | undefined) || [];
  if (edits.length > 0) {
    const additions = edits.filter(e => e.field === "added");
    const deletions = edits.filter(e => e.field === "deleted");
    const moves = edits.filter(e => e.field === "moved");
    const textChanges = edits.filter(e => e.field === "text");
    const colorChanges = edits.filter(e => e.field === "color");

    if (additions.length > 0) {
      conversationContext += `\n\n[USER ADDED:]`;
      additions.forEach(edit => {
        conversationContext += `\n  - ${edit.newValue}`;
      });
    }

    if (deletions.length > 0) {
      conversationContext += `\n\n[USER DELETED:]`;
      deletions.forEach(edit => {
        conversationContext += `\n  - "${edit.oldValue}"`;
      });
    }

    if (textChanges.length > 0) {
      conversationContext += `\n\n[USER EDITED TEXT:]`;
      textChanges.forEach(edit => {
        conversationContext += `\n  - "${edit.oldValue}" → "${edit.newValue}"`;
      });
    }

    if (colorChanges.length > 0) {
      conversationContext += `\n\n[USER CHANGED COLORS:]`;
      colorChanges.forEach(edit => {
        conversationContext += `\n  - ${edit.oldValue} → ${edit.newValue}`;
      });
    }

    if (moves.length > 0) {
      conversationContext += `\n\n[USER MOVED ${moves.length} item(s)]`;
    }

    conversationContext += `\nAcknowledge these changes naturally if relevant.`;
  }

  const prompt = isExecutionMode
    ? conversationContext  // Execution mode: just the execution instructions
    : `Conversation so far:\n${conversationContext}\n\nRespond to the latest user message.`;


  try {
    // Use execution agent when plan is approved (no confirmPlan tool available)
    const agent = isExecutionMode ? executionAgent : planningAgent;
    const result = await run(agent, prompt, { stream: true, maxTurns: 50 });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const toolCalls: ToolCall[] = [];
        const callIdToToolName = new Map<string, string>();
        let pendingCreateCanvas = false;
        let textContent = "";
        let controllerClosed = false;

        const safeEnqueue = (chunk: Uint8Array) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(chunk);
            } catch {
              controllerClosed = true;
            }
          }
        };

        try {
          let sentTextLength = 0;

          for await (const event of result) {
            // Handle streaming text deltas - try multiple event types
            if (event.type === "raw_model_stream_event") {
              const data = event.data as Record<string, unknown>;

              // Debug: log the data type to see what's inside
              if (process.env.NODE_ENV === 'development' && data.type) {
                console.log('[RAW EVENT DATA]', data.type);
              }

              // Handle output_text_delta (OpenAI Agents format)
              if (data.type === "output_text_delta") {
                const delta = data.delta as string;
                if (delta) {
                  textContent += delta;
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`)
                  );
                  sentTextLength = textContent.length;
                }
              }

              // Handle response.output_text.delta (Anthropic format - fallback)
              else if (data.type === "response.output_text.delta") {
                const delta = data.delta as string;
                if (delta) {
                  textContent += delta;
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`)
                  );
                  sentTextLength = textContent.length;
                }
              }

              // Handle content_block_delta (Anthropic format)
              else if (data.type === "content_block_delta") {
                const deltaData = data.delta as Record<string, unknown>;
                if (deltaData?.type === "text_delta") {
                  const delta = deltaData.text as string;
                  if (delta) {
                    textContent += delta;
                    safeEnqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`)
                    );
                    sentTextLength = textContent.length;
                  }
                }
              }
            }

            // Handle text_delta events directly (OpenAI Realtime format)
            else if ((event.type as string) === "text_delta" || (event.type as string) === "response.text.delta") {
              const delta = (event as { delta?: string }).delta || (event as { text?: string }).text;
              if (delta) {
                textContent += delta;
                safeEnqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`)
                );
                sentTextLength = textContent.length;
              }
            }

            // Handle run item events (tool calls)
            if (event.type === "run_item_stream_event") {
              const item = event.item as unknown as Record<string, unknown>;

              // Final message output — text was already sent via deltas above,
              // so we only update textContent for bookkeeping (no re-send).
              if (item.type === "message_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const content = rawItem?.content as Array<{ type: string; text?: string }>;
                if (content) {
                  for (const block of content) {
                    if (block.type === "output_text" && block.text) {
                      textContent = block.text;
                      sentTextLength = textContent.length;
                    }
                  }
                }
              }

              // Handle tool calls
              if (item.type === "tool_call_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const toolName = rawItem?.name as string;
                const rawArgs = rawItem?.arguments as string;
                // Agents SDK uses camelCase callId (not snake_case call_id)
                const callId = (rawItem?.callId || rawItem?.call_id) as string;

                // Track callId → toolName for matching output items
                if (callId && toolName) {
                  callIdToToolName.set(callId, toolName);
                }
                if (toolName === "createCanvas") {
                  pendingCreateCanvas = true;
                }

                if (toolName && rawArgs) {
                  try {
                    const args = JSON.parse(rawArgs);
                    toolCalls.push({ toolName, args });
                    safeEnqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool", toolName, args })}\n\n`)
                    );
                  } catch {
                    // Skip malformed
                  }
                }
              }

              // Handle tool call outputs (separate event type from Agents SDK)
              if (item.type === "tool_call_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                // Agents SDK uses camelCase callId and includes name on output items
                const callId = (rawItem?.callId || rawItem?.call_id) as string;
                const outputItemName = rawItem?.name as string;
                const rawOutput = rawItem?.output as Record<string, unknown> | string | undefined;

                // Unwrap Agents SDK output wrapper: {type: "text", text: "{...}"}
                let outputString: string | undefined;
                if (typeof rawOutput === "string") {
                  outputString = rawOutput;
                } else if (rawOutput && typeof rawOutput === "object" && rawOutput.type === "text" && typeof rawOutput.text === "string") {
                  outputString = rawOutput.text;
                }

                // Match createCanvas by: direct name, callId lookup, or pending flag
                const matchedToolName = outputItemName || callIdToToolName.get(callId || "");
                let isCreateCanvas = matchedToolName === "createCanvas";

                if (!isCreateCanvas && pendingCreateCanvas && outputString) {
                  try {
                    const parsed = JSON.parse(outputString);
                    if (parsed && typeof parsed === "object" && "canvasId" in parsed) {
                      isCreateCanvas = true;
                    }
                  } catch {}
                }

                if (isCreateCanvas && outputString) {
                  pendingCreateCanvas = false;
                  try {
                    const result = JSON.parse(outputString);
                    safeEnqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool_result", toolName: "createCanvas", result })}\n\n`)
                    );
                  } catch {}
                }
              }
            }
          }

          // Generate title if requested (first response in a new chat from home)
          let chatTitle: string | null = null;
          if (generateTitle && messages.length >= 1) {
            console.log('[Chat API] Generating title...');
            const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
            if (firstUserMsg?.content) {
              console.log('[Chat API] First user message:', firstUserMsg.content.substring(0, 50));
              // Quick title generation with GPT-4o-mini
              try {
                const titleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                      {
                        role: "system",
                        content: "Generate a concise, descriptive chat title (max 50 chars) based on the user's message. Return ONLY the title, no quotes or explanation.",
                      },
                      {
                        role: "user",
                        content: firstUserMsg.content,
                      },
                    ],
                    max_tokens: 20,
                  }),
                });

                if (titleResponse.ok) {
                  const titleData = await titleResponse.json();
                  chatTitle = titleData.choices?.[0]?.message?.content?.trim() || null;
                  console.log('[Chat API] Generated title:', chatTitle);
                } else {
                  console.error('[Chat API] Title API failed:', titleResponse.status);
                }
              } catch (err) {
                console.error("[Chat API] Title generation failed:", err);
              }
            }
          }

          // Send done event
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", text: textContent, toolCalls, chatTitle })}\n\n`)
          );
        } catch (err) {
          console.error("Stream error:", err);
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`)
          );
        }

        if (!controllerClosed) {
          controller.close();
          controllerClosed = true;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(JSON.stringify({ error: "Agent execution failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
