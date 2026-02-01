import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are a friendly AI assistant helping someone work on an infinite canvas. You can create sticky notes, shapes, and text to help them brainstorm and organize ideas.

After creating things on the canvas, ALWAYS write a short friendly message to the user. Keep it brief and warm, like:
- "Done! Added those for you."
- "Here you go!"
- "All set — let me know if you want more!"

When positioning elements, spread them out so they don't overlap. Use x,y coordinates where (0,0) is the center. Offset multiple items by about 250 pixels.`,
    messages,
    maxSteps: 3,
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
        execute: async ({ text, color }) => {
          return `Created ${color} sticky note: "${text}"`;
        },
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
        execute: async ({ type, color }) => {
          return `Created ${color} ${type}`;
        },
      },
      createText: {
        description: "Create a text label on the canvas",
        parameters: z.object({
          text: z.string().describe("The text content"),
          x: z.number().describe("X position on canvas"),
          y: z.number().describe("Y position on canvas"),
        }),
        execute: async ({ text }) => {
          return `Created text: "${text}"`;
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
