"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconLightning } from "@mirohq/design-system-icons";
import { ChatInput } from "@/components/toolbar/ChatInput";
import { CardFan } from "@/components/home/CardFan";
import {
  attentionCards,
  teamCards,
  cardChat,
  type FanCardData,
  type ChatMessage,
} from "@/components/home/card-data";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { spring } from "@/lib/motion";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = [
  "What needs my attention",
  "What's happening in my team",
] as const;
type Tab = (typeof TABS)[number];

const TAB_CARDS: Record<Tab, FanCardData[]> = {
  "What needs my attention": attentionCards,
  "What's happening in my team": teamCards,
};

// ---------------------------------------------------------------------------
// Streaming chat hook
// ---------------------------------------------------------------------------

function useStreamingChat(cardId: string | null) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!cardId) {
      setVisibleMessages([]);
      return;
    }

    const messages = cardChat[cardId] ?? [];
    setVisibleMessages([]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    messages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg]);
      }, msg.delay + i * 100);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [cardId]);

  return visibleMessages;
}

// ---------------------------------------------------------------------------
// Simple markdown-ish renderer (bold only)
// ---------------------------------------------------------------------------

function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-zinc-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const lines = message.text.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
        <span className="flex items-center justify-center text-white" style={{ width: 14, height: 14 }}>
          <IconLightning />
        </span>
      </div>

      {/* Message */}
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-600">
        {lines.map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            <RichLine text={line} />
          </p>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("What needs my attention");
  const [selectedCard, setSelectedCard] = useState<FanCardData | null>(null);
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Andy";

  const messages = useStreamingChat(selectedCard?.id ?? null);

  const handleSelect = useCallback((card: FanCardData) => {
    setSelectedCard(card);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // Pre-warm the canvas route
  useEffect(() => {
    router.prefetch("/space/unassigned/canvas/warmup");
  }, [router]);

  // Use chat from provider
  const { append, isLoading, openFullscreen, registerHandlers } = useChat();

  // Register no-op handlers on mount
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

      {/* Create new button — fixed top-right */}
      <button
        onClick={handleCreateEmptyCanvas}
        disabled={isCreating}
        className="fixed top-5 right-6 z-[9900] px-4 py-2 bg-gray-100 text-gray-900 text-sm font-heading font-medium rounded-full hover:bg-gray-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
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

      <AnimatePresence mode="wait">
        {selectedCard ? (
          /* ─── Detail view ─── */
          <motion.div
            key="detail"
            className="relative z-10 flex w-full flex-col items-center px-6 pt-16"
            style={{ maxWidth: 576, margin: "0 auto" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button */}
            <motion.button
              onClick={handleBack}
              className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-heading font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.snappy, delay: 0.1 }}
            >
              <span className="flex items-center justify-center" style={{ width: 16, height: 16 }}>
                <IconArrowLeft />
              </span>
              Back
            </motion.button>

            {/* Selected card — 3D spin + fly up */}
            <div style={{ perspective: 1200 }}>
              <motion.div
                initial={{ rotateY: 0, y: 120, scale: 1.06 }}
                animate={{ rotateY: 360, y: 0, scale: 1 }}
                transition={{
                  rotateY: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  y: { ...spring.bouncy, delay: 0.05 },
                  scale: { ...spring.bouncy, delay: 0.05 },
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div style={{ width: 160, aspectRatio: "3 / 4" }}>
                  {selectedCard.type === "decision" ? (
                    /* Gold decision card */
                    <div className="relative h-full w-full">
                      <div
                        className="absolute -inset-[1px] rounded-[17px] pointer-events-none opacity-70"
                        style={{ background: "linear-gradient(135deg, rgb(255 232 158), rgb(238 193 47), rgb(255 163 70), rgb(212 175 55), rgb(246 211 101))" }}
                      />
                      <div
                        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl"
                        style={{
                          backfaceVisibility: "hidden",
                          background: "linear-gradient(135deg, rgb(255 232 158), rgb(238 193 47), rgb(255 163 70), rgb(212 175 55), rgb(246 211 101))",
                        }}
                      >
                        <div className="flex items-center px-3 pt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/approved.svg" alt="Decision" className="w-6 h-6 flex-shrink-0" />
                        </div>
                        <div className="px-3 pt-2">
                          <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-4">
                            {selectedCard.title}
                          </p>
                        </div>
                        <div className="flex-1" />
                        <div className="px-3 pb-3">
                          <p className="text-[10px] text-gray-500/80 truncate">
                            {selectedCard.spaceName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard card */
                    <div
                      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="flex items-center px-3 pt-3">
                        {!selectedCard.isAgent && selectedCard.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedCard.avatar}
                            alt={selectedCard.sourceName || ""}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center" style={{ width: 12, height: 12 }}>
                            <IconLightning />
                          </span>
                        )}
                      </div>
                      <div className="px-3 pt-2">
                        <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-4">
                          {selectedCard.title}
                        </p>
                      </div>
                      <div className="flex-1" />
                      <div className="px-3 pb-3">
                        <p className="text-[10px] text-gray-400 truncate">
                          {selectedCard.spaceName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Chat stream */}
            <motion.div
              className="mt-8 flex w-full flex-col gap-5 pb-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator — show while more messages are pending */}
              {messages.length < (cardChat[selectedCard.id]?.length ?? 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900">
                    <span className="flex items-center justify-center text-white" style={{ width: 14, height: 14 }}>
                      <IconLightning />
                    </span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-zinc-300"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-zinc-300"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-zinc-300"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          /* ─── Home view ─── */
          <motion.div
            key="home"
            className="relative z-10 flex flex-1 h-full flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Greeting */}
            <motion.h1
              className="text-5xl font-heading font-medium tracking-tight text-zinc-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.05 }}
            >
              Hey {firstName}
            </motion.h1>

            <motion.h2
              className="mt-3 text-3xl font-heading font-medium text-zinc-400"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.15 }}
            >
              How are you going to save the world today?
            </motion.h2>

            {/* Card fan */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CardFan
                  cards={TAB_CARDS[activeTab]}
                  onSelect={handleSelect}
                />
              </motion.div>
            </AnimatePresence>

            {/* Tabs under card fan */}
            <motion.div
              className="mt-6 flex items-center gap-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.25 }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-heading transition-colors ${
                    activeTab === tab
                      ? "font-medium text-zinc-900"
                      : "font-medium text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="card-home-tab-bg"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat input — same as canvas toolbar chat mode */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]" style={{ width: 420 }}>
        <ChatInput
          onSubmit={handleSubmit}
          onFocusChange={() => {}}
          isLoading={isLoading}
          hasMessages={false}
          hasPendingQuestion={false}
          canvasState={{ frames: [], orphans: [], arrows: [] }}
          voiceState="idle"
        />
      </div>
    </div>
  );
}
