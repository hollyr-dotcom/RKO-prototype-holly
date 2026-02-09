"use client";

import { useState, useCallback, useRef } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
};

type ToolHandler = (toolName: string, args: Record<string, unknown>) => void;

type ShapeInfo = {
  id: string;
  type: string;
  text?: string;
  color?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdBy: string;
};

type FrameInfo = ShapeInfo & {
  children: ShapeInfo[];
  arrows: ShapeInfo[];
};

type CanvasState = {
  frames: FrameInfo[];
  orphans: ShapeInfo[];
  arrows: ShapeInfo[];
};

type UserEdit = {
  shapeId: string;
  field: string;
  oldValue: string;
  newValue: string;
};

type CanvasStateGetter = () => CanvasState;
type UserEditsGetter = () => UserEdit[];

export function useAgent(onToolCall?: ToolHandler, getCanvasState?: CanvasStateGetter, getUserEdits?: UserEditsGetter) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const append = useCallback(
    async (message: { role: "user"; content: string }) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create assistant message placeholder
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolInvocations: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Get current canvas state if available
        const canvasState = getCanvasState ? getCanvasState() : { frames: [], orphans: [], arrows: [] };
        const userEdits = getUserEdits ? getUserEdits() : [];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              toolInvocations: m.toolInvocations, // Include tool calls so server can detect approved plans
            })),
            canvasState,
            userEdits,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        // Buffer content until stream is complete to avoid visual glitches
        let bufferedText = "";
        let bufferedTools: Array<{ toolName: string; args: Record<string, unknown> }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text") {
                  // Buffer text content
                  bufferedText += data.content;
                }

                if (data.type === "tool") {
                  // Buffer tool invocation
                  bufferedTools.push({ toolName: data.toolName, args: data.args });

                  // Show these tools immediately in the UI (don't wait for done)
                  // - askUser: questions need to show floating immediately
                  // - confirmPlan: plan approval needs to show floating immediately
                  // - showProgress: step tracking
                  // - checkpoint: feedback pause points
                  // - webSearch: show "Searching..." indicator
                  const immediateTools = ["askUser", "confirmPlan", "showProgress", "checkpoint", "webSearch"];
                  if (immediateTools.includes(data.toolName)) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? {
                              ...m,
                              content: bufferedText,
                              toolInvocations: [...bufferedTools],
                            }
                          : m
                      )
                    );
                  }

                  // Call the tool handler immediately for canvas updates
                  if (onToolCall) {
                    onToolCall(data.toolName, data.args);
                  }
                }

                if (data.type === "done") {
                  // Stream complete - update message with all buffered content at once
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: bufferedText,
                            toolInvocations: bufferedTools.length > 0 ? bufferedTools : undefined,
                          }
                        : m
                    )
                  );
                }

                if (data.type === "error") {
                  console.error("Agent error:", data.message);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Request error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, onToolCall, getCanvasState, getUserEdits]
  );

  return {
    messages,
    append,
    isLoading,
    setMessages, // Expose for voice transcripts
  };
}
