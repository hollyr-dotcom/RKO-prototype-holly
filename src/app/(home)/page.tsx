"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { HomePromptInput } from "@/components/HomePromptInput";
import { HomeFeed } from "@/components/feed/HomeFeed";
import { PromptStickyNotes } from "@/components/PromptStickyNotes";
import { useChat } from "@/hooks/useChat";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"foryou" | "recent">("foryou");
  const [isCreating, setIsCreating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setNotesVisible(el.scrollTop === 0);
  }, []);

  // Pre-warm the canvas route so it's already compiled when user clicks "Create new"
  useEffect(() => {
    router.prefetch("/space/unassigned/canvas/warmup");
  }, [router]);

  // Use chat from provider
  const { append, isLoading, openFullscreen, registerHandlers } = useChat();

  // Register no-op handlers on mount (safe defaults for home page)
  useEffect(() => {
    registerHandlers({
      handleToolCall: () => {},
      getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
      getUserEdits: () => [],
    });
  }, [registerHandlers]);

  // Navigation from home → canvas is handled by ChatProvider:
  // - When AI calls createCanvas → ChatProvider intercepts and navigates
  // - When AI uses canvas tools without createCanvas → ChatProvider's safety net auto-creates and navigates
  // - Chat transitions from fullscreen → sidepanel via canvas-handoff in sessionStorage

  const handleSubmit = (text: string) => {
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
      // Clear any stale chatMode so the canvas opens clean (no fullscreen overlay)
      localStorage.setItem("chatMode", "minimized");
      router.push(`/space/${space}/canvas/${newCanvas.id}`);
    } catch {
      setIsCreating(false);
    }
  };

  // Full-page loading when navigating to canvas
  if (isCreating) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Setting up your canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="relative h-full w-full overflow-y-auto bg-white">
      {/* Create new button — fixed top-right, positioned next to spark button */}
      <button
        onClick={handleCreateEmptyCanvas}
        disabled={isCreating}
        className="fixed top-4 right-4 z-[9900] px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-full hover:bg-gray-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
      >
        {isCreating ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-gray-400/30 border-t-gray-700 rounded-full animate-spin" />
            Creating...
          </span>
        ) : (
          "+ Create new"
        )}
      </button>

      {/* Two-section layout: hero sticky, cards scroll underneath */}
      <div className="w-full flex flex-col">
        {/* Top spacer — positions hero at ~1/3 from top initially */}
        <div className="h-[18vh] shrink-0" />

        {/* Welcome heading — scrolls with page */}
        <div className="flex flex-col items-center px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Welcome back, Andy
          </h1>
        </div>

        {/* Sticky search: prompt + suggestions */}
        <div className="sticky top-0 z-20">
          <div className="bg-white pt-4 pb-2 flex flex-col items-center px-6">
            <HomePromptInput onSubmit={handleSubmit} isLoading={isLoading} onInputChange={(v) => setIsTyping(v.length > 0)} />

            <div className={`mt-5 transition-all duration-300 ${isTyping ? "opacity-0 pointer-events-none" : "opacity-100"} ${notesVisible ? "" : "-mb-[220px]"}`}>
              <PromptStickyNotes onSelect={handleSubmit} visible={notesVisible} />
            </div>
          </div>

          {/* Fade overlay — white fading to transparent so content disappears under search */}
          <div className="h-24 -mb-24 pointer-events-none bg-gradient-to-b from-white to-transparent" />
        </div>

        {/* Bottom section */}
        <div className="flex flex-col items-center pt-20 pb-16">
          {/* Tab toggle */}
          <div className="z-10 bg-gray-100 rounded-full p-1 flex shrink-0">
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

          {/* Feed content — clips at viewport edge */}
          {activeTab === "foryou" ? (
            <HomeFeed />
          ) : (
            <div className="text-center py-16 w-full max-w-[1200px] px-6">
              <p className="text-sm text-gray-400">Recent items coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
