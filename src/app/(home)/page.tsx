"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomePromptInput } from "@/components/HomePromptInput";
import { useChat } from "@/hooks/useChat";

const suggestions = [
  "Prep me for quarterly review",
  "Compare roadmap to insights",
  "Surprise me",
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"foryou" | "recent">("foryou");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Pre-warm the canvas route so it's already compiled when user clicks "Create new"
  useEffect(() => {
    router.prefetch("/space/unassigned/canvas/warmup");
  }, [router]);

  // Use chat from provider
  const { messages, append, isLoading, openFullscreen, closeFullscreen, registerHandlers } = useChat();

  // Register no-op handlers on mount (safe defaults for home page)
  useEffect(() => {
    registerHandlers({
      handleToolCall: () => {},
      getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
      getUserEdits: () => [],
    });
  }, [registerHandlers]);

  // Watch for plan approval and create canvas
  useEffect(() => {
    const checkForApproval = async () => {
      // Find the most recent confirmPlan
      const planMessage = messages.findLast(
        (m) => m.role === "assistant" && m.toolInvocations?.some((t) => t.toolName === "confirmPlan")
      );
      if (!planMessage) return;

      const planIndex = messages.indexOf(planMessage);

      // Check if user approved after the plan
      const laterMessages = messages.slice(planIndex + 1);
      const userApproval = laterMessages.find(
        (m) => m.role === "user" && m.content.toLowerCase().includes("approve")
      );

      if (!userApproval) return;

      // Check if we already navigated (to avoid duplicate creation)
      if (sessionStorage.getItem("canvas-handoff")) return;

      // Auto-generate a short canvas name from the prompt
      const canvasName = originalPrompt.slice(0, 50) || "New Canvas";

      // Create an unassigned canvas (no space)
      const response = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: canvasName,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create canvas");
        return;
      }

      const newCanvas = await response.json();

      // Store handoff data in sessionStorage
      sessionStorage.setItem(
        "canvas-handoff",
        JSON.stringify({
          messages,
          isFullscreenChat: true,
        })
      );

      // Navigate to new canvas (use spaceId if assigned, otherwise "unassigned")
      const space = newCanvas.spaceId || "unassigned";
      router.push(`/space/${space}/canvas/${newCanvas.id}`);
    };

    checkForApproval();
  }, [messages, originalPrompt, router]);

  const handleSubmit = (text: string) => {
    if (!originalPrompt) {
      setOriginalPrompt(text); // Store first prompt for canvas naming
    }
    openFullscreen(true); // Set fromHome FIRST before append
    append({ role: "user", content: text });
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

  // Full-page loading when navigating to canvas
  if (isCreating) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Setting up your canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Welcome View */}
      <div className="h-full w-full bg-gray-100 overflow-y-auto">
            <div className="flex flex-col items-center px-6">
              {/* Top bar */}
              <div className="w-full flex justify-end items-center py-4">
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

              {/* Prompt input */}
              <HomePromptInput onSubmit={handleSubmit} isLoading={isLoading} />

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
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
              <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-2xl pb-10">
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
    </div>
  );
}
