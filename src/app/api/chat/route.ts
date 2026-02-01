import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are a helpful AI assistant working on an infinite canvas. You can create visual elements to help users brainstorm, plan, and organize their ideas.

When the user asks you to create something, use your tools to add elements to the canvas. Be creative and helpful.

Available tools:
- createSticky: Create a sticky note with text
- createShape: Create a shape (rectangle, ellipse, triangle, diamond)
- createText: Create a text label

Position elements thoughtfully - spread them out so they don't overlap. Use x,y coordinates where (0,0) is the center of the canvas.`,
    messages,
    tools: {
      createSticky: tool({
        description: "Create a sticky note on the canvas",
        parameters: z.object({
          text: z.string().describe("The text content of the sticky note"),
          x: z.number().describe("X position on canvas (0 is center)"),
          y: z.number().describe("Y position on canvas (0 is center)"),
          color: z
            .enum(["yellow", "blue", "green", "pink", "orange", "violet"])
            .describe("Color of the sticky note"),
        }),
      }),
      createShape: tool({
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
      }),
      createText: tool({
        description: "Create a text label on the canvas",
        parameters: z.object({
          text: z.string().describe("The text content"),
          x: z.number().describe("X position on canvas"),
          y: z.number().describe("Y position on canvas"),
        }),
      }),
    },
  });

  return result.toDataStreamResponse();
}
