import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import type { Plan, Task } from "@/types/plan";

export const maxDuration = 300; // 5 minutes for long plans

// ============================================
// PLANNING AGENT - Creates the plan
// ============================================

const planningAgent = new Agent({
  name: "Task Planner",
  model: "gpt-5.2",
  instructions: `<context>
You are a planning agent that breaks down user goals into clear, executable steps for a whiteboard canvas.
</context>

<task>
When given a goal, create a numbered plan of 3-8 concrete steps. Each step should be:
- Specific and actionable
- Achievable with canvas tools (shapes, stickies, arrows, frames, text)
- Clear enough that another agent can execute it
</task>

<output>
ALWAYS call createPlan() with your plan. Never just describe the plan in text.
Each step title should be short (3-6 words).
Each step description should explain what to create on the canvas.
</output>`,
  tools: [
    tool({
      name: "createPlan",
      description: "Create a plan with numbered steps. ALWAYS use this tool to output your plan.",
      parameters: z.object({
        steps: z.array(z.object({
          title: z.string().describe("Short step title (3-6 words)"),
          description: z.string().describe("What to create on canvas for this step"),
        })).min(3).max(8),
      }),
      execute: async ({ steps }) => JSON.stringify({ steps }),
    }),
    tool({
      name: "webSearch",
      description: "Search the web for information to inform your plan.",
      parameters: z.object({
        query: z.string(),
        purpose: z.string(),
      }),
      execute: async ({ query, purpose }) => {
        try {
          const apiKey = process.env.TAVILY_API_KEY;
          if (!apiKey) return JSON.stringify({ error: "No API key", query });

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              search_depth: "basic",
              include_answer: true,
              max_results: 3,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);
          const data = await response.json();

          return JSON.stringify({
            query,
            purpose,
            summary: data.answer || "No summary",
            results: data.results?.slice(0, 3).map((r: { title: string; content: string }) =>
              `${r.title}: ${r.content?.slice(0, 200)}`
            ),
          });
        } catch {
          return JSON.stringify({ error: "Search failed", query });
        }
      },
    }),
  ],
});

// ============================================
// EXECUTION AGENT - Executes one step
// ============================================

const executionAgent = new Agent({
  name: "Task Executor",
  model: "gpt-5.2",
  instructions: `<context>
You execute a single step of a plan on a whiteboard canvas. You have tools to create shapes, stickies, arrows, frames, and text.
</context>

<task>
Execute the given step by creating appropriate visual elements on the canvas.
Use shapes+arrows for diagrams, stickies for brainstorms, frames to group content.
</task>

<constraints>
- Check canvas state for occupied positions
- Keep 250px spacing between items
- Use colors meaningfully
- Call markStepComplete() when done
</constraints>`,
  tools: [
    tool({
      name: "createSticky",
      description: "Create a sticky note",
      parameters: z.object({
        text: z.string(),
        x: z.number(),
        y: z.number(),
        color: z.enum(["yellow", "blue", "green", "pink", "orange", "violet"]),
      }),
      execute: async (args) => JSON.stringify({ created: "sticky", ...args }),
    }),
    tool({
      name: "createShape",
      description: "Create a shape for diagrams",
      parameters: z.object({
        type: z.enum(["rectangle", "ellipse", "triangle", "diamond"]),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        color: z.enum(["black", "blue", "green", "red", "orange", "yellow", "violet"]),
      }),
      execute: async (args) => JSON.stringify({ created: "shape", ...args }),
    }),
    tool({
      name: "createText",
      description: "Create a text label",
      parameters: z.object({
        text: z.string(),
        x: z.number(),
        y: z.number(),
      }),
      execute: async (args) => JSON.stringify({ created: "text", ...args }),
    }),
    tool({
      name: "createFrame",
      description: "Create a frame to group content",
      parameters: z.object({
        name: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      execute: async (args) => JSON.stringify({ created: "frame", ...args }),
    }),
    tool({
      name: "createArrow",
      description: "Create an arrow to connect elements",
      parameters: z.object({
        startX: z.number(),
        startY: z.number(),
        endX: z.number(),
        endY: z.number(),
      }),
      execute: async (args) => JSON.stringify({ created: "arrow", ...args }),
    }),
    tool({
      name: "markStepComplete",
      description: "Call this when you've finished creating all elements for this step",
      parameters: z.object({
        summary: z.string().describe("Brief summary of what was created"),
      }),
      execute: async ({ summary }) => JSON.stringify({ complete: true, summary }),
    }),
  ],
});

// ============================================
// API HANDLERS
// ============================================

export async function POST(req: Request) {
  const { action, goal, plan, taskIndex, canvasState } = await req.json();

  const encoder = new TextEncoder();

  // Helper to send SSE
  const sendEvent = (controller: ReadableStreamDefaultController, data: Record<string, unknown>) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // ============================================
  // ACTION: CREATE PLAN
  // ============================================
  if (action === "create_plan") {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send planning started
          sendEvent(controller, { type: "planning_started", goal });

          const prompt = `User goal: "${goal}"

Create a plan to accomplish this on a whiteboard canvas. Consider what visual elements would best represent this information.`;

          const result = await run(planningAgent, prompt, { stream: true, maxTurns: 10 });

          let planSteps: Array<{ title: string; description: string }> = [];
          let searchResults: Array<{ query: string; summary: string }> = [];

          for await (const event of result) {
            if (event.type === "run_item_stream_event") {
              const item = event.item as unknown as Record<string, unknown>;

              if (item.type === "tool_call_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const toolName = rawItem?.name as string;
                const rawArgs = rawItem?.arguments as string;

                if (toolName && rawArgs) {
                  try {
                    const args = JSON.parse(rawArgs);

                    if (toolName === "webSearch") {
                      sendEvent(controller, {
                        type: "searching",
                        query: args.query,
                        purpose: args.purpose,
                      });
                    }

                    if (toolName === "createPlan") {
                      planSteps = args.steps;
                    }
                  } catch { /* skip */ }
                }
              }

              // Capture search results from tool outputs
              if (item.type === "tool_call_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const output = rawItem?.output as string;
                if (output) {
                  try {
                    const parsed = JSON.parse(output);
                    if (parsed.summary && parsed.query) {
                      searchResults.push({ query: parsed.query, summary: parsed.summary });
                      sendEvent(controller, { type: "search_complete", ...parsed });
                    }
                  } catch { /* skip */ }
                }
              }
            }
          }

          // Create the plan object
          if (planSteps.length > 0) {
            const newPlan: Plan = {
              id: `plan_${Date.now()}`,
              goal,
              tasks: planSteps.map((step, index) => ({
                id: `task_${index}`,
                index,
                title: step.title,
                description: step.description,
                status: 'pending' as const,
              })),
              currentTaskIndex: -1,
              status: 'awaiting_approval',
              createdAt: Date.now(),
            };

            sendEvent(controller, { type: "plan_created", plan: newPlan });
          } else {
            sendEvent(controller, { type: "error", message: "Failed to create plan" });
          }

          sendEvent(controller, { type: "done" });
        } catch (err) {
          sendEvent(controller, { type: "error", message: String(err) });
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
  }

  // ============================================
  // ACTION: EXECUTE STEP
  // ============================================
  if (action === "execute_step") {
    const task = plan.tasks[taskIndex] as Task;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Mark task as running
          sendEvent(controller, {
            type: "task_started",
            taskIndex,
            task: { ...task, status: 'running' },
          });

          // Build context
          let canvasContext = "";
          if (canvasState && canvasState.length > 0) {
            const xPositions = canvasState.map((item: { x?: number }) => item.x ?? 0);
            const yPositions = canvasState.map((item: { y?: number }) => item.y ?? 0);
            const maxX = Math.max(...xPositions);
            const maxY = Math.max(...yPositions);
            canvasContext = `\nCanvas has ${canvasState.length} items. Occupied area: x 0-${maxX + 250}, y 0-${maxY + 200}. Start new content at x=${maxX + 300} or y=${maxY + 250}.`;
          } else {
            canvasContext = "\nCanvas is empty. Start at (0, 0).";
          }

          const prompt = `Execute this step:

STEP ${taskIndex + 1}: ${task.title}
${task.description}

OVERALL GOAL: ${plan.goal}
${canvasContext}

Create the visual elements for this step, then call markStepComplete().`;

          const result = await run(executionAgent, prompt, { stream: true, maxTurns: 20 });

          const toolCalls: Array<{ toolName: string; args: Record<string, unknown> }> = [];
          let stepSummary = "";

          for await (const event of result) {
            if (event.type === "run_item_stream_event") {
              const item = event.item as unknown as Record<string, unknown>;

              if (item.type === "tool_call_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const toolName = rawItem?.name as string;
                const rawArgs = rawItem?.arguments as string;

                if (toolName && rawArgs) {
                  try {
                    const args = JSON.parse(rawArgs);

                    if (toolName === "markStepComplete") {
                      stepSummary = args.summary;
                    } else {
                      toolCalls.push({ toolName, args });
                      // Stream each tool call for real-time canvas updates
                      sendEvent(controller, {
                        type: "tool_call",
                        toolName,
                        args,
                      });
                    }
                  } catch { /* skip */ }
                }
              }
            }
          }

          // Mark task complete
          sendEvent(controller, {
            type: "task_completed",
            taskIndex,
            task: {
              ...task,
              status: 'done',
              result: stepSummary || `Created ${toolCalls.length} elements`,
              toolCalls,
            },
          });

          sendEvent(controller, { type: "done" });
        } catch (err) {
          sendEvent(controller, {
            type: "task_error",
            taskIndex,
            task: { ...task, status: 'error', error: String(err) },
          });
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
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
