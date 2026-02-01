import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-5.2-chat-latest"),
    system: `You help users create content on an infinite canvas using tools.

When user asks to CREATE something (stickies, shapes, text):
1. Say a SHORT acknowledgment like "Here you go!" or "Done!"
2. IMMEDIATELY call the appropriate tools
3. The content goes ON THE CANVAS via tools, not in your message

When user asks a QUESTION (not creating):
- Answer normally in chat, no tools needed

Example - user says "make 3 stickies with dog jokes":
- You say: "Here are some dog jokes for you!"
- Then call createSticky 3 times with the jokes

IMPORTANT: Always call tools when asked to create things. The tools put content on the canvas.

Positioning: spread items out, use x,y coords, center is (0,0), offset by 250px between items.`,
    messages,
    tools: {
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
