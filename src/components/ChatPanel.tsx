"use client";

import type { Message } from "ai";
import { useState } from "react";

interface ChatPanelProps {
  onClose: () => void;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

// Collapsible tool invocation block
function ToolBlock({ toolInvocations }: { toolInvocations: Message["toolInvocations"] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolInvocations || toolInvocations.length === 0) return null;

  // Generate summary text
  const getSummary = () => {
    const counts: Record<string, number> = {};
    toolInvocations.forEach((t) => {
      const name = t.toolName.replace("create", "").toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    });

    const parts = Object.entries(counts).map(([name, count]) => {
      const plural = count > 1 ? "s" : "";
      return `${count} ${name}${plural}`;
    });

    return `Creating ${parts.join(", ")} on canvas`;
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-colors"
      >
        <span className="text-sm text-gray-500">{getSummary()}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-1 px-4 py-2 rounded-xl border border-gray-200">
          {toolInvocations.map((tool, i) => (
            <div key={i} className="text-xs text-gray-500 py-1">
              <span className="text-green-600 mr-2">✓</span>
              {tool.toolName === "createSticky" && (
                <>Sticky: "{(tool.args as { text: string }).text}"</>
              )}
              {tool.toolName === "createShape" && (
                <>Shape: {(tool.args as { type: string }).type}</>
              )}
              {tool.toolName === "createText" && (
                <>Text: "{(tool.args as { text: string }).text}"</>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  onClose,
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
}: ChatPanelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input);
    setInput("");
  };

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">Chat</span>
          <span className="text-xs text-gray-500">with AI</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p className="mb-2">Ask me anything</p>
            <p className="text-xs text-gray-400">
              I can help you create, organize, and brainstorm on the canvas
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.role === "user" ? "flex justify-end" : ""
              }`}
            >
              {message.role === "user" ? (
                /* User message: light gray bg, right aligned */
                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                /* AI message: full width, no bg */
                <div className="w-full">
                  {message.content && (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                  )}

                  {/* Tool invocations shown as collapsible block AFTER text */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="mt-3">
                      <ToolBlock toolInvocations={message.toolInvocations} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-1 py-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
            <span
              className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter reply..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 rounded-full border-0 outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
