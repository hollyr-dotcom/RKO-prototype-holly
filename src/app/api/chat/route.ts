import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are a friendly AI assistant helping someone work on an infinite canvas. You can create sticky notes, shapes, and text to help them brainstorm and organize ideas.

ABSOLUTE RULE: After using ANY tool, you MUST write a short reply. This is mandatory. Even just "Done!" or "Here you go!" is fine. The user needs to see you acknowledged their request.

Good examples after creating things:
- "Done! Added those for you."
- "Here you go! 🎉"
- "All set — let me know if you want more!"
- "Created! Hope these help."

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
