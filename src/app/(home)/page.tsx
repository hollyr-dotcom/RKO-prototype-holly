"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HomePromptInput } from "@/components/HomePromptInput";
import { CardStack } from "@/components/feed/CardStack";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [allDone, setAllDone] = useState(false);
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
      {/* Create new button — fixed top-right */}
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

      {/* Feed content — fades out when all cards are done */}
      <motion.div
        animate={{ opacity: allDone ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: allDone ? "none" : "auto" }}
        className="absolute inset-0 overflow-y-auto flex flex-col items-center px-6 pt-[8vh] pb-28"
      >
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-xl text-gray-500 mt-1">Here&apos;s what you need to know</p>
        </div>
        <CardStack onAllDone={() => setAllDone(true)} />
      </motion.div>

      {/* Centered heading shown after all cards are done */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-6 text-center pointer-events-none"
            style={{ bottom: "calc(50% + 48px)" }}
          >
            <h1 className="text-4xl font-bold text-gray-900">Nicely done!</h1>
            <p className="text-xl text-gray-500 mt-2">How can I help next?</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt bar — slides to vertical center when all cards are done */}
      <div
        className="absolute left-6 right-6"
        style={{
          bottom: allDone ? "50%" : "2rem",
          transform: allDone ? "translateY(50%)" : "translateY(0)",
          transition: "bottom 700ms, transform 700ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <HomePromptInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
