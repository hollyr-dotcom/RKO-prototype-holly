"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PromptBar } from "@/components/PromptBar";
import { useChat } from "@/hooks/useChat";

const suggestions = [
  "Prep me for quarterly review",
  "Compare roadmap to insights",
  "Surprise me",
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"foryou" | "recent">("foryou");
  const [isCreating, setIsCreating] = useState(false);

  // Force-compile the canvas route in dev mode by making a real request.
  // router.prefetch() doesn't trigger full compilation — this does.
  // By the time the user clicks "Create new", the route is already compiled.
  useEffect(() => {
    fetch("/space/unassigned/canvas/_warmup", { priority: "low" as RequestPriority }).catch(() => {});
  }, []);

  // Use chat from provider
  const { messages, append, isLoading, chatMode, setChatMode, registerHandlers } = useChat();

  // Register no-op handlers on mount (safe defaults for home page)
  useEffect(() => {
    registerHandlers({
      handleToolCall: () => {},
      getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
      getUserEdits: () => [],
    });
  }, [registerHandlers]);

  const handleSubmit = (text: string) => {
    setChatMode("fullscreen");
    const shouldGenerateTitle = messages.length === 0;
    append({ role: "user", content: text }, shouldGenerateTitle);
  };

  const handleCreateEmptyCanvas = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled" }),
      });

      if (!response.ok) {
        console.error("Failed to create canvas");
        setIsCreating(false);
        return;
      }

      const newCanvas = await response.json();
      const space = newCanvas.spaceId || "unassigned";
      router.push(`/space/${space}/canvas/${newCanvas.id}`);
    } catch {
      setIsCreating(false);
    }
  };

  const showPromptBar = chatMode === "minimized";

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Welcome View */}
      <div className="h-full w-full bg-gray-100 overflow-y-auto">
        <div className="flex flex-col items-center px-6">
          {/* Top bar */}
          <div className="w-full flex justify-start items-center py-4">
            <button
              onClick={handleCreateEmptyCanvas}
              disabled={isCreating}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:scale-95 active:bg-gray-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "+ Create new"
              )}
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900 mt-12 mb-8">
            Welcome back, Andy
          </h1>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSubmit(suggestion)}
                className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-white/60 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Tab toggle */}
          <div className="mt-10 bg-gray-200 rounded-full p-1 flex">
            <button
              onClick={() => setActiveTab("foryou")}
              className={`px-5 py-1.5 rounded-full text-sm transition-all ${
                activeTab === "foryou"
                  ? "bg-white shadow-sm font-medium text-gray-900"
                  : "text-gray-500"
              }`}
            >
              For you
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-5 py-1.5 rounded-full text-sm transition-all ${
                activeTab === "recent"
                  ? "bg-white shadow-sm font-medium text-gray-900"
                  : "text-gray-500"
              }`}
            >
              Recent
            </button>
          </div>

          {/* Content cards */}
          <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-2xl pb-32">
            <div className="bg-white rounded-2xl shadow-sm p-5 h-48" />
            <div className="bg-white rounded-2xl shadow-sm p-5 h-64">
              <p className="text-sm font-medium text-gray-900">
                Competing priorities!!!!
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 h-56" />
            <div className="bg-white rounded-2xl shadow-sm p-5 h-44" />
          </div>
        </div>
      </div>

      {/* Floating prompt bar at bottom center */}
      {showPromptBar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <PromptBar
            onSubmit={handleSubmit}
            isLoading={isLoading}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
