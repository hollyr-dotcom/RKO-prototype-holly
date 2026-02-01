"use client";

import type { Message } from "ai";
import { useState } from "react";
import Markdown from "react-markdown";
import {
  IconPlus,
  IconMicrophone,
  IconArrowUp,
} from "@mirohq/design-system-icons";

// Voice wave icon
function VoiceWaveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
      <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
      <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
    </svg>
  );
}

interface ChatPanelProps {
  onClose: () => void;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

// Question block with clickable suggestions
function QuestionBlock({
  question,
  suggestions,
  onSelect,
  isLatest,
}: {
  question: string;
  suggestions: string[];
  onSelect: (answer: string) => void;
  isLatest: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-900">{question}</p>
      {isLatest && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Plan block with approve/reject buttons
function PlanBlock({
  title,
  steps,
  summary,
  onApprove,
  onReject,
  isLatest,
}: {
  title: string;
  steps: string[];
  summary: string;
  onApprove: () => void;
  onReject: () => void;
  isLatest: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-900">{title}</p>
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
            <span className="text-gray-700">{step}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">{summary}</p>
      </div>

      {/* Approve/Reject buttons - only show on latest */}
      {isLatest && (
        <div className="px-4 py-3 flex gap-2 border-t border-gray-200">
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// Thinking status block
function ThinkingBlock({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </span>
      <span>{status}</span>
    </div>
  );
}

// Collapsible tool invocation block (for create tools)
function ToolBlock({ toolInvocations }: { toolInvocations: Message["toolInvocations"] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolInvocations || toolInvocations.length === 0) return null;

  // Filter out special tools - they're handled separately
  const createTools = toolInvocations.filter(
    (t) => !["askUser", "confirmPlan", "showThinking"].includes(t.toolName)
  );
  if (createTools.length === 0) return null;

  // Generate summary text
  const getSummary = () => {
    const counts: Record<string, number> = {};
    createTools.forEach((t) => {
      const name = t.toolName.replace("create", "").toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    });

    const parts = Object.entries(counts).map(([name, count]) => {
      const plural = count > 1 ? "s" : "";
      return `${count} ${name}${plural}`;
    });

    return `Created ${parts.join(", ")}`;
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
          {createTools.map((tool, i) => (
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
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col relative z-50">
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
          messages.map((message, index) => {
            // Check if this message has special tool calls
            const askUserTool = message.toolInvocations?.find(
              (t) => t.toolName === "askUser"
            );
            const confirmPlanTool = message.toolInvocations?.find(
              (t) => t.toolName === "confirmPlan"
            );
            const showThinkingTool = message.toolInvocations?.find(
              (t) => t.toolName === "showThinking"
            );
            const isLatestMessage = index === messages.length - 1;

            return (
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
                      <div className="text-sm text-gray-900">
                        <Markdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                          }}
                        >
                          {message.content}
                        </Markdown>
                      </div>
                    )}

                    {/* askUser tool - render as question with suggestions */}
                    {askUserTool && (
                      <div className={message.content ? "mt-3" : ""}>
                        <QuestionBlock
                          question={(askUserTool.args as { question: string }).question}
                          suggestions={(askUserTool.args as { suggestions: string[] }).suggestions}
                          onSelect={(answer) => onSubmit(answer)}
                          isLatest={isLatestMessage && !isLoading}
                        />
                      </div>
                    )}

                    {/* confirmPlan tool - render as plan card with approve/reject */}
                    {confirmPlanTool && (
                      <div className={message.content || askUserTool ? "mt-3" : ""}>
                        <PlanBlock
                          title={(confirmPlanTool.args as { title: string }).title}
                          steps={(confirmPlanTool.args as { steps: string[] }).steps}
                          summary={(confirmPlanTool.args as { summary: string }).summary}
                          onApprove={() => onSubmit("Approved! Go ahead.")}
                          onReject={() => onSubmit("I'd like to make some changes.")}
                          isLatest={isLatestMessage && !isLoading}
                        />
                      </div>
                    )}

                    {/* showThinking tool - render as status with animated dots */}
                    {showThinkingTool && isLatestMessage && isLoading && (
                      <div className={message.content || askUserTool || confirmPlanTool ? "mt-3" : ""}>
                        <ThinkingBlock
                          status={(showThinkingTool.args as { status: string }).status}
                        />
                      </div>
                    )}

                    {/* Other tool invocations shown as collapsible block */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className={message.content || askUserTool || confirmPlanTool ? "mt-3" : ""}>
                        <ToolBlock toolInvocations={message.toolInvocations} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full">
          {/* Plus button */}
          <button
            type="button"
            className="p-2 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
            title="Add"
          >
            <IconPlus size="small" />
          </button>

          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter reply..."
            disabled={isLoading}
            className="flex-1 py-1.5 text-sm bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 min-w-0"
          />

          {/* Mic button */}
          <button
            type="button"
            className="p-2 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
            title="Voice input"
          >
            <IconMicrophone size="small" />
          </button>

          {/* Voice mode / Submit button */}
          {input.trim() ? (
            <button
              type="submit"
              className="w-8 h-8 m-0.5 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
              title="Send"
            >
              <IconArrowUp size="small" />
            </button>
          ) : (
            <button
              type="button"
              className="w-8 h-8 m-0.5 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
              title="Voice mode"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
                <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
                <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
                <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
                <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
