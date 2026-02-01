import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are a friendly AI assistant helping someone work on an infinite canvas. You can create sticky notes, shapes, and text to help them brainstorm and organize ideas.

CRITICAL: You MUST always respond with a short, friendly message. Every single response needs conversational text. Keep it brief (1-2 sentences) but warm. Examples:
- "Done! I added a yellow sticky for you."
- "Here you go — 3 ideas to get you started!"
- "Created! Let me know if you want to add more."
- "All set! I spread them out so you can see each one."

Never ever respond with only tool calls and no text. The user should always see a message from you.

When positioning elements, spread them out so they don't overlap. Use x,y coordinates where (0,0) is the center. Offset multiple items by about 250 pixels.`,
    messages,
    tools: {
      createSticky: {
        description: "Create a sticky note on the canvas",
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
        description: "Create a shape on the canvas",
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
        description: "Create a text label on the canvas",
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
