"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconLightning } from "@mirohq/design-system-icons";
import { CardFan } from "@/components/home/CardFan";
import {
  attentionCards,
  teamCards,
  cardChat,
  type FanCardData,
  type ChatMessage,
} from "@/components/home/card-data";
import { useAuth } from "@/hooks/useAuth";
import { spring } from "@/lib/motion";
import { useOverscrollNavigation } from "@/hooks/useOverscrollNavigation";
import { useShrinkingHeader } from "@/hooks/useShrinkingHeader";

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

const GREETINGS = [
  "Hello",
  "Howdy",
  "Buongiorno",
  "Hola",
  "Bonjour",
  "Hey",
  "Ciao",
  "Aloha",
  "Hej",
  "Salut",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("What needs my attention");
  const [selectedCard, setSelectedCard] = useState<FanCardData | null>(null);
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Andy";
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  useEffect(() => {
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { fontSize: headerFontSize, isSticky: headerIsSticky } = useShrinkingHeader({ scrollRef });
  const messages = useStreamingChat(selectedCard?.id ?? null);

  useOverscrollNavigation({
    scrollRef,
    direction: "down",
    targetPath: "/tasks",
    enabled: !selectedCard,
  });

  const handleSelect = useCallback((card: FanCardData) => {
    setSelectedCard(card);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return (
    <div ref={scrollRef} className="relative h-full w-full overflow-y-auto">
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
            className="relative z-10 flex flex-col items-center pt-[20vh]"
            style={{ minHeight: "150vh" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Greeting — shrinks on scroll, sticks at min size */}
            <div
              className="text-center w-full"
              style={{
                position: headerIsSticky ? "sticky" : "relative",
                top: headerIsSticky ? 0 : undefined,
                zIndex: headerIsSticky ? 5 : undefined,
                paddingTop: headerIsSticky ? 16 : 0,
                paddingBottom: headerIsSticky ? 16 : 0,
              }}
            >
              <motion.h1
                className="font-heading font-medium tracking-tight text-zinc-900"
                style={{ fontSize: headerFontSize }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.gentle, delay: 0.05 }}
              >
                <span className="font-serif">{greeting}, {firstName}</span>
              </motion.h1>
            </div>
{/*
            <motion.h2
              className="text-2xl font-heading font-medium text-zinc-400"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.15 }}
            >
              How are you going to save the world today?
            </motion.h2> */}

            {/* Card fan */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
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
                  className={`relative rounded-full px-3 py-3 text-md font-heading transition-colors ${
                    activeTab === tab
                      ? "font-medium text-gray-900"
                      : "font-medium text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="card-home-tab-bg"
                      className="absolute inset-0 rounded-full bg-gray-200"
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
    </div>
  );
}
