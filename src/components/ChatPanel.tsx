"use client";

import type { Message } from "ai";

interface ChatPanelProps {
  onClose: () => void;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
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
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {/* Show tool calls */}
                {message.toolInvocations &&
                  message.toolInvocations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {message.toolInvocations.map((tool, i) => (
                        <div
                          key={i}
                          className="text-xs text-gray-500 flex items-center gap-1"
                        >
                          <span className="text-green-600">✓</span>
                          Created {tool.toolName.replace("create", "")}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
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
