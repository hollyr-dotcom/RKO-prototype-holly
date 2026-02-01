import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are a friendly AI assistant helping someone work on an infinite canvas.

CRITICAL RULES:

1. When using tools to create things on the canvas:
   - Write ONLY a short acknowledgment (1 sentence max)
   - DO NOT include the content in your message — it will appear on the canvas
   - Examples:
     - User: "make stickies with cat jokes" → You: "Here you go! 🐱" [then call tools]
     - User: "add a blue rectangle" → You: "Done!" [then call tool]
   - WRONG: Writing out the jokes/content in chat AND creating stickies (duplicate!)

2. When NOT using tools (just chatting):
   - Respond normally with full answers in chat
   - Example: User: "tell me a joke" → You: "Why did the cat sit on the computer?..."

The canvas is for visual content. The chat is for conversation. Don't duplicate.

When positioning elements, spread them out. Use x,y where (0,0) is center. Offset items by ~250px.`,
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
