import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-5.2-chat-latest"),
    temperature: 1,
    system: `You are an agentic AI assistant helping users create content on an infinite canvas.

## TASK COMPLEXITY ASSESSMENT

When user makes a request, first assess if it's SIMPLE or COMPLEX:

SIMPLE tasks (execute immediately):
- Create specific items with clear requirements ("make 3 yellow stickies with dog jokes")
- Simple questions ("what can you do?")
- Single straightforward actions

COMPLEX tasks (enter agentic flow):
- Vague or underspecified requests ("help me brainstorm a product launch")
- Multiple possible approaches ("design a workflow for my team")
- Requires understanding user's goals/context
- Multi-step planning needed

## SIMPLE TASK FLOW

1. Say a SHORT acknowledgment like "Here you go!" or "Done!"
2. IMMEDIATELY call the appropriate create tools
3. The content goes ON THE CANVAS via tools, not in your message

## COMPLEX TASK FLOW (Agentic Mode)

For complex/vague requests, use the askUser tool:
1. Call askUser() with your question and 2-4 suggested answers
2. Wait for user response
3. Ask follow-up questions as needed (one at a time)
4. Once you have enough context, execute like a simple task

Example - user says "help me brainstorm":
1. Call askUser("What would you like to brainstorm?", ["Product ideas", "Marketing strategies", "Team processes"])
2. User picks or types answer
3. Call askUser("How many ideas should I generate?", ["3-5 ideas", "5-10 ideas", "10+ ideas"])
4. Call confirmPlan() with your plan for user approval
5. Once approved, create the stickies/content

## PLAN CONFIRMATION

Before executing complex tasks, show the user your plan:
1. Call confirmPlan() with a title and list of steps
2. Wait for user to approve or reject
3. If approved, execute the plan
4. If rejected, ask what to change

## CONVERSATIONAL MESSAGES (no tools needed)

When user sends reactions or comments like:
- "nice", "cool", "love it", "omg so funny", "thanks", "perfect"
- Questions about what was just created
- Feedback or opinions

Just respond conversationally. Do NOT create more content or repeat what you just made.
Only create new content when explicitly asked.

## GENERAL RULES

- Do NOT use emojis in your responses
- Positioning: spread items out, use x,y coords, center is (0,0), offset by 250px between items
- Only call create tools when user explicitly asks to create/make/add something new`,
    messages,
    tools: {
      askUser: {
        description: "Ask the user a clarifying question with suggested answers. Use this for complex tasks that need more context before executing.",
        parameters: z.object({
          question: z.string().describe("The question to ask the user"),
          suggestions: z
            .array(z.string())
            .min(2)
            .max(4)
            .describe("2-4 suggested answers the user can click"),
        }),
      },
      confirmPlan: {
        description: "Show the user a plan for approval before executing. Use this after gathering requirements for complex tasks.",
        parameters: z.object({
          title: z.string().describe("Short title for the plan"),
          steps: z
            .array(z.string())
            .min(1)
            .max(6)
            .describe("List of steps you will take (1-6 steps)"),
          summary: z.string().describe("Brief summary of what will be created"),
        }),
      },
      createSticky: {
        description: "Create a sticky note on the canvas. Always write a friendly message to the user BEFORE calling this tool.",
        parameters: z.object({
          text: z.string().describe("The text content of the sticky note"),
          x: z.number().describe("X position on canvas (0 is center)"),
          y: z.number().describe("Y position on canvas (0 is center)"),
          color: z
            .enum(["yellow", "blue", "green", "pink", "orange", "violet"])
            .describe("Color of the sticky note"),
        }),
      },
      createShape: {
        description: "Create a shape on the canvas. Always write a friendly message to the user BEFORE calling this tool.",
        parameters: z.object({
          type: z
            .enum(["rectangle", "ellipse", "triangle", "diamond"])
            .describe("Type of shape"),
          x: z.number().describe("X position on canvas"),
          y: z.number().describe("Y position on canvas"),
          width: z.number().describe("Width of the shape"),
          height: z.number().describe("Height of the shape"),
          color: z
            .enum(["black", "blue", "green", "red", "orange", "yellow"])
            .describe("Color of the shape"),
        }),
      },
      createText: {
        description: "Create a text label on the canvas. Always write a friendly message to the user BEFORE calling this tool.",
        parameters: z.object({
          text: z.string().describe("The text content"),
          x: z.number().describe("X position on canvas"),
          y: z.number().describe("Y position on canvas"),
        }),
      },
    },
  });

  return result.toDataStreamResponse();
}
