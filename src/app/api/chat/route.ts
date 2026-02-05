import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

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
  description: "REQUIRED for all questions! Shows clickable button pills the user can tap. NEVER write questions as plain text - always use this tool instead. It creates a much better UX.",
  parameters: z.object({
    question: z.string().describe("The question to ask"),
    suggestions: z.array(z.string()).min(2).max(4).describe("2-4 clickable answer options"),
  }),
  execute: async ({ question, suggestions }) => {
    return JSON.stringify({ question, suggestions });
  },
});

const confirmPlanTool = tool({
  name: "confirmPlan",
  description: "Propose a plan for substantial work. After calling this, STOP and wait. When user approves, EXECUTE this plan - don't make a new one.",
  parameters: z.object({
    title: z.string().describe("What you're planning to create"),
    steps: z.array(z.string()).min(1).max(12).describe("The steps you'll take"),
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
  }),
  execute: async ({ query, purpose }) => {
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
          max_results: 3, // Reduced for speed
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

      return JSON.stringify({
        query,
        purpose,
        summary: data.answer || "No summary available",
        keyFindings: formattedResults,
        instruction: "USE THESE SPECIFIC FINDINGS in your stickies! Include real names, numbers, and examples from above."
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

// Helper to generate unique IDs for created items
const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// --- Canvas Creation Tools ---
const createStickyTool = tool({
  name: "createSticky",
  description: "⚠️ ONLY for adding a SINGLE sticky to existing content. For 2+ stickies, you MUST use createLayout() instead - it handles positioning automatically. Never call this multiple times in sequence.",
  parameters: z.object({
    text: z.string().describe("The text content"),
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

// --- Layout Tool (REQUIRED for multiple items) ---
const createLayoutTool = tool({
  name: "createLayout",
  description: `🎯 REQUIRED for 2+ items! Creates organized, aligned content in a frame.

LAYOUT TYPES:
- "grid" + type:"sticky" → For brainstorms, style guides, grouped notes (aligned in rows)
- "grid" + type:"shape" → For navigation items, feature lists (aligned boxes)
- "hierarchy" + type:"shape" → For org charts, sitemaps, trees (with connecting arrows)
- "flow" + type:"shape" → For user journeys, processes (left-to-right with arrows)

The layout engine handles ALL positioning - items will be perfectly aligned in a grid or tree structure.
NEVER use createSticky/createShape multiple times - use this instead!`,
  parameters: z.object({
    type: z.enum(["grid", "hierarchy", "flow"]).describe("Layout type"),
    frameName: z.string().describe("Name for the frame"),
    items: z.array(z.object({
      type: z.enum(["sticky", "shape", "text"]).describe("Item type"),
      text: z.string().describe("Content text"),
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
  description: "Move an existing item to a new position. Use this to reorganize the canvas layout.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the item to move"),
    x: z.number().describe("New X position"),
    y: z.number().describe("New Y position"),
  }),
  execute: async (args) => {
    return JSON.stringify({ moved: args.itemId, x: args.x, y: args.y });
  },
});

// ============================================
// AGENT CONFIGURATION
// ============================================

// Planning agent - has confirmPlan tool for creating plans
const planningAgent = new Agent({
  name: "Canvas Assistant",
  model: "gpt-5.2",
  instructions: `You create visual artifacts on a whiteboard canvas.

WORKFLOW:
1. Assess if you need real-world context (news, releases, specific data you don't have)
2. Only if needed → webSearch() for facts/examples
3. Ask exactly 2 questions with askUser() (one at a time)
4. Create plan with confirmPlan()

USE WEB SEARCH WISELY - Only when you truly need:
- Current events, recent releases, latest versions
- Real company/product names, actual competitors
- Statistics, market data, specific examples
- If user says "latest X" and you're not sure what that is

DON'T search if:
- Making wireframes/diagrams (just create them)
- User gave you all the details already
- It's a generic task (brainstorm, org chart, flowchart)

PLAN STEP FORMAT - KEEP IT SHORT:
- Each step should be 3-8 words max
- Be concise and scannable
- BAD: "Create a homepage wireframe frame and lay out all the main sections including header, hero, features, testimonials, and footer"
- GOOD: "Create homepage wireframe frame"
- BAD: "Add 8-12 packaged service ideas per cluster with problem, AI approach, client, deliverables, and pricing"
- GOOD: "Add service ideas to each cluster"

IMPORTANT - NO DUPLICATE CONTENT:
- When calling confirmPlan(), do NOT write out the steps as text too
- Just say something brief then call the tool

QUESTIONS: Ask exactly 2 questions total (one at a time), then create your plan. No more, no less.

FOR REQUESTS:
- Real-world topics: webSearch first, then 2 questions, then plan
- Most requests: ask 2 questions, then plan
- Simple tweaks: just do it directly

CANVAS: Check [CANVAS STATE] for positions. Use SAFE ZONES.`,
  tools: [
    askUserTool,
    confirmPlanTool,
    webSearchTool,
  ],
});

// Execution agent - NO confirmPlan tool, can only execute
const executionAgent = new Agent({
  name: "Canvas Executor",
  model: "gpt-5.2",
  instructions: `You are executing an approved plan. Create canvas items step by step.

🚨 CRITICAL RULE #1: WHEN USER SAYS "CONTINUE", YOU MUST CONTINUE! 🚨
If the last user message is "Continue" or similar, you MUST immediately:
1. Call showProgress() for the next step
2. Execute that step
3. Keep going until done or next checkpoint

NEVER respond with just text when user says "Continue" - START WORKING IMMEDIATELY!

⚠️ CRITICAL RULE #2: NEVER call createSticky or createShape multiple times!
If you need 2+ items, you MUST use createLayout() instead.

EXECUTION FLOW:
Work through steps in sequence. For each step:
1. Call showProgress(stepNumber, "step title", "starting")
2. Create canvas items using ONE createLayout() call per section
3. Call showProgress(stepNumber, "step title", "completed")
4. Either: continue to next step OR call checkpoint() at a milestone

CHECKPOINTS - PAUSE AT MILESTONES:
- Call checkpoint() after completing 3-4 related steps
- After a checkpoint, STOP and wait for user to click "Continue"
- When user clicks "Continue", IMMEDIATELY resume from next step

YOUR MESSAGE BEFORE CHECKPOINT:
- Brief (1 sentence): "Here's the wireframes so far—take a look."

CHECKPOINT LABEL:
- Format: "Review [what you created]"

=====================================================
createLayout() - THE ONLY WAY TO CREATE GROUPED ITEMS
=====================================================

FRAME NAMING:
- Use descriptive names: "Homepage sections", "Product details", "Checkout flow"
- DON'T include step numbers: "Step 2 — Homepage" ✗
- DO use clear labels: "Homepage wireframe" ✓

WHEN TO USE STICKIES (type: "sticky"):
- Brainstorms, ideas, notes
- Style guides, design specs
- Feature lists, requirements
→ Keep text SHORT: title + 2-3 bullet points max
→ Use MORE stickies with LESS text each (better than few stickies with lots of text)

WHEN TO USE SHAPES (type: "shape"):
- Org charts, hierarchies (with arrows)
- Flowcharts, user journeys (with arrows)
- Sitemaps with SHORT labels only (1-3 words per box)
→ Shapes are for SHORT labels only: "Home", "Cart", "About"
→ If text is longer than 3 words, USE STICKIES instead!

GRID + STICKIES (for brainstorms, style guides, notes):
createLayout({
  type: "grid",
  frameName: "Brand Colors",
  items: [
    { type: "sticky", text: "Primary Blue\\n#0066CC", color: "blue" },
    { type: "sticky", text: "Accent Gold\\n#FFD700", color: "yellow" },
    { type: "sticky", text: "Background\\n#F5F5F5", color: "grey" }
  ],
  columns: 3
})

GRID + SHAPES (for wireframes, component grids):
createLayout({
  type: "grid",
  frameName: "Page Sections",
  items: [
    { type: "shape", text: "Header", color: "blue" },
    { type: "shape", text: "Hero", color: "green" },
    { type: "shape", text: "Footer", color: "blue" }
  ],
  columns: 3
})

HIERARCHY + SHAPES (for org charts, sitemaps):
createLayout({
  type: "hierarchy",
  frameName: "Site Map",
  items: [
    { type: "shape", text: "Home", color: "blue" },
    { type: "shape", text: "Products", color: "green", parentIndex: 0 },
    { type: "shape", text: "About", color: "green", parentIndex: 0 }
  ]
})

FLOW + SHAPES (for processes, journeys):
createLayout({
  type: "flow",
  frameName: "Checkout Flow",
  items: [
    { type: "shape", text: "Cart", color: "blue" },
    { type: "shape", text: "Payment", color: "yellow" },
    { type: "shape", text: "Done", color: "green" }
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
    checkpointTool,
    requestFeedbackTool,
    webSearchTool,
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
  ],
});

// ============================================
// API HANDLER
// ============================================

export async function POST(req: Request) {
  const { messages, canvasState } = await req.json();

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
  let conversationContext: string;
  let isExecutionMode = false;

  if (approvedPlan) {
    // EXECUTION MODE: Track completed steps and continue from where we left off
    isExecutionMode = true;

    // Find completed steps by looking at showProgress("completed") and checkpoint calls
    const completedSteps: number[] = [];
    let lastCheckpointStep = 0;

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
            lastCheckpointStep = Math.max(...completedSteps, 0);
          }
        });
      }
    }

    const nextStep = completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;
    const totalSteps = approvedPlan.steps.length;
    const isComplete = nextStep > totalSteps;

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
2. Call checkpoint() with review CTA like "Review all wireframes"

Keep your message VERY brief - the card shows details.
` : `
🚨 USER CLICKED "CONTINUE" - START WORKING NOW! 🚨

NEXT STEP IS ${nextStep}: "${approvedPlan.steps[nextStep - 1]}"

DO THIS IMMEDIATELY:
1. showProgress(${nextStep}, "${approvedPlan.steps[nextStep - 1]}", "starting")
2. createLayout(...) to make the content
3. showProgress(${nextStep}, "${approvedPlan.steps[nextStep - 1]}", "completed")
4. Continue to step ${nextStep + 1} or checkpoint() if milestone reached

DO NOT write explanatory text first - CALL showProgress() IMMEDIATELY!`}`;
  } else {
    // Normal mode: build conversation context
    // Count how many questions have already been asked
    let questionsAsked = 0;
    messages.forEach((m: MessageWithTools) => {
      if (m.toolInvocations?.some(t => t.toolName === 'askUser')) {
        questionsAsked++;
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

    // Add question tracking to context
    if (questionsAsked >= 2) {
      conversationContext += `\n\n🛑 YOU HAVE ALREADY ASKED ${questionsAsked} QUESTIONS. DO NOT ASK MORE. Call confirmPlan() NOW with your plan.`;
    } else if (questionsAsked === 1) {
      conversationContext += `\n\n[Questions asked: 1 of 2. Ask 1 more question, then call confirmPlan().]`;
    }
  }

  // Include canvas state if provided
  if (canvasState && canvasState.length > 0) {
    // Calculate actual bounding box using position + dimensions
    type CanvasItem = {
      id: string;
      type: string;
      text?: string;
      color?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    canvasState.forEach((item: CanvasItem) => {
      const x = item.x ?? 0;
      const y = item.y ?? 0;
      const w = item.width ?? 200;
      const h = item.height ?? 150;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const canvasDescription = canvasState
      .map((item: CanvasItem) => {
        const w = item.width ?? 200;
        const h = item.height ?? 150;
        return `- [${item.id}] ${item.type} at (${item.x ?? 0}, ${item.y ?? 0}) size ${w}x${h}: "${item.text?.slice(0, 40) || 'no text'}"`;
      })
      .join("\n");

    conversationContext += `

[CANVAS STATE - ${canvasState.length} items already on canvas]
OCCUPIED AREA: x=${Math.round(minX)} to ${Math.round(maxX)}, y=${Math.round(minY)} to ${Math.round(maxY)}

⚠️ START NEW CONTENT HERE (pick one):
  → RIGHT SIDE: x=${Math.round(maxX + 100)}, y=${Math.round(minY)} (creates columns)
  → BELOW: x=${Math.round(minX)}, y=${Math.round(maxY + 100)} (creates rows)

DO NOT place anything in the occupied area above!

Existing items:
${canvasDescription}`;
  } else {
    conversationContext += `

[CANVAS STATE - Empty]
Canvas is empty. Start placing content at (0, 0).`;
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
        let textContent = "";

        try {
          let sentTextLength = 0;

          for await (const event of result) {
            // Handle streaming text deltas
            if (event.type === "raw_model_stream_event") {
              const data = event.data as Record<string, unknown>;
              if (data.type === "response.output_text.delta") {
                const delta = data.delta as string;
                if (delta) {
                  textContent += delta;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`)
                  );
                  sentTextLength = textContent.length;
                }
              }
            }

            // Handle run item events (tool calls)
            if (event.type === "run_item_stream_event") {
              const item = event.item as unknown as Record<string, unknown>;

              // Handle final message output
              if (item.type === "message_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const content = rawItem?.content as Array<{ type: string; text?: string }>;
                if (content) {
                  for (const block of content) {
                    if (block.type === "output_text" && block.text) {
                      if (block.text.length > sentTextLength) {
                        const newText = block.text.slice(sentTextLength);
                        textContent = block.text;
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ type: "text", content: newText })}\n\n`)
                        );
                      } else {
                        textContent = block.text;
                      }
                    }
                  }
                }
              }

              // Handle tool calls
              if (item.type === "tool_call_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const toolName = rawItem?.name as string;
                const rawArgs = rawItem?.arguments as string;

                if (toolName && rawArgs) {
                  try {
                    const args = JSON.parse(rawArgs);
                    toolCalls.push({ toolName, args });

                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool", toolName, args })}\n\n`)
                    );
                  } catch {
                    // Skip malformed
                  }
                }
              }
            }
          }

          // Send done event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", text: textContent, toolCalls })}\n\n`)
          );
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`)
          );
        }

        controller.close();
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
