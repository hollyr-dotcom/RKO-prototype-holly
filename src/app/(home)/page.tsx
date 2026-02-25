"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HorizontalFeed } from "@/components/feed/HorizontalFeed";
import { PromptBar } from "@/components/PromptBar";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"foryou" | "recent">("foryou");
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Andy";

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

  const handleSubmit = (text: string) => {
    openFullscreen(true);
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
    <div className="relative h-full w-full bg-white overflow-hidden">
      {/* Miro logo — top-left of content area */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/miro-logo.svg" alt="Miro" className="absolute top-7 left-7 z-10 w-[56px] h-[20px]" />

      {/* For you / Recent toggle — centered, aligned with logo and create button */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex items-center bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setActiveTab("foryou")}
          className={`px-5 py-1.5 rounded-full text-sm transition-all duration-150 ${
            activeTab === "foryou"
              ? "bg-white shadow-sm font-medium text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          For you
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-5 py-1.5 rounded-full text-sm transition-all duration-150 ${
            activeTab === "recent"
              ? "bg-white shadow-sm font-medium text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Recent
        </button>
      </div>

      {/* Create new button — fixed top-right */}
      <button
        onClick={handleCreateEmptyCanvas}
        disabled={isCreating}
        className="fixed top-5 right-6 z-[9900] px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-full hover:bg-gray-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
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

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col pt-[8vh] pb-28">
        {/* Heading */}
        <div className="mb-4 pt-20 text-center px-6">
          <h1 className="text-4xl leading-none font-bold tracking-tight text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-4xl leading-none text-gray-500 mt-1">Here&apos;s what you need to know</p>
        </div>

        {/* Feed content */}
        {activeTab === "foryou" ? (
          <HorizontalFeed />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Recent items coming soon</p>
          </div>
        )}
      </div>

      {/* Prompt bar */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
        <div style={{ width: 712 }}>
          <div className="mx-auto max-w-3xl px-6">
            <PromptBar
              onSubmit={handleSubmit}
              isLoading={isLoading}
              autoFocus
              inputBg="#f2f2f2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
