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
  description: "STOP and wait for user to review work. Human-in-the-loop pause point. After calling this, STOP working and wait for user response.",
  parameters: z.object({
    completed: z.string().describe("What you just finished - be specific"),
    nextUp: z.string().describe("What you'll do next IF user says continue (or 'Finished!' if plan is complete)"),
    options: z.array(z.string()).min(2).max(4).describe("If mid-plan: ['Continue', 'Adjust X', 'Add Y']. If plan complete: next step suggestions like ['Add mobile version', 'Create another page']"),
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
  description: "Create a sticky note - best for brainstorms, ideas, lists, pros/cons, notes. For diagrams and flowcharts, prefer createShape + createArrow instead! Returns an ID you can use with createArrow or updateSticky.",
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
  description: "Create a shape - USE THIS for diagrams! Rectangles for org charts, flowcharts, sitemaps. Ellipses for start/end nodes. Diamonds for decisions. Returns an ID - USE THIS ID with createArrow to connect shapes! For labeled shapes, create a text element on top.",
  parameters: z.object({
    type: z.enum(["rectangle", "ellipse", "triangle", "diamond"]),
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

// --- Layout Tool (PREFERRED for multiple items) ---
const createLayoutTool = tool({
  name: "createLayout",
  description: `PREFERRED way to create organized content! Creates a frame with items automatically positioned.
- "grid": For brainstorms, lists, features (items in rows/columns)
- "hierarchy": For org charts, trees (parent-child with arrows)
- "flow": For processes, journeys (left-to-right with arrows)

The layout engine handles all positioning - you just specify the content!`,
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
3. If request is vague or you need user input → askUser() (max 1-2 questions)
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

QUESTIONS: Maximum 1-2 questions total. Only ask what's essential. Research before asking!

FOR REQUESTS:
- Real-world topics: webSearch first, then plan
- Most requests: just make a reasonable plan directly
- Only truly ambiguous: ask 1-2 questions first
- Simple: just create items directly

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

EXECUTION FLOW:
1. Call showProgress(stepNumber, "step title", "starting")
2. Create canvas items for that step using createLayout()
3. Call showProgress(stepNumber, "step title", "completed")
4. After 2-3 steps: call checkpoint() and STOP - wait for user to respond
5. When user says "Continue": resume with next steps
6. When ALL steps done: call checkpoint() with completion message and STOP

CHECKPOINT = STOP AND WAIT:
- Checkpoint is a human-in-the-loop pause - STOP after calling it
- Let user review work and decide next action
- Do NOT keep working after checkpoint - wait for user response

WHEN PLAN IS COMPLETE:
- Call checkpoint() with message like "All done! Created [summary of what was built]"
- nextUp should be "Finished!" to signal completion

USE createLayout() - IT HANDLES POSITIONING FOR YOU!

For multiple related items, ALWAYS use createLayout():

1. GRID - for brainstorms, lists, feature sets:
   createLayout({
     type: "grid",
     frameName: "Key Features",
     items: [
       { type: "sticky", text: "Feature 1", color: "yellow" },
       { type: "sticky", text: "Feature 2", color: "yellow" },
       { type: "sticky", text: "Feature 3", color: "blue" }
     ],
     options: { columns: 3 }
   })

2. HIERARCHY - for org charts, trees:
   createLayout({
     type: "hierarchy",
     frameName: "Org Chart",
     items: [
       { type: "shape", text: "CEO" },
       { type: "shape", text: "CTO", parentIndex: 0 },
       { type: "shape", text: "CFO", parentIndex: 0 }
     ]
   })
   // Arrows are drawn automatically!

3. FLOW - for processes, user journeys:
   createLayout({
     type: "flow",
     frameName: "User Journey",
     items: [
       { type: "shape", text: "Start" },
       { type: "shape", text: "Step 1" },
       { type: "shape", text: "Step 2" },
       { type: "shape", text: "End" }
     ]
   })
   // Arrows are drawn automatically!

The layout engine calculates all positions - DON'T specify coordinates!

For single items or modifications, use createSticky/createShape/etc.

IMPORTANT:
- STOP after every checkpoint
- Use createLayout() for organized content
- Layout engine handles positioning automatically`,
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
    // EXECUTION MODE: Skip conversation history, just execute the plan
    isExecutionMode = true;
    conversationContext = `EXECUTION MODE - User approved this plan. Execute it NOW.

Plan: "${approvedPlan.title}"
${approvedPlan.steps.map((s, i) => `Step ${i + 1}: ${s}`).join('\n')}

YOUR TASK: Execute this plan step by step.
1. Call showProgress(1, "${approvedPlan.steps[0]}", "starting")
2. Create canvas items for step 1
3. Call showProgress(1, "${approvedPlan.steps[0]}", "completed")
4. Continue with step 2, etc.
5. Use checkpoint() every 3-4 steps

DO NOT call confirmPlan() - the plan is already approved!
DO NOT output the plan as text - just execute it with tools!`;
  } else {
    // Normal mode: build conversation context
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
