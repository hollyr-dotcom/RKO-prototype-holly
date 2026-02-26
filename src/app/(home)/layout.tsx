"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FrozenRouter } from "@/components/FrozenRouter";
import { getPageTransitionDirection } from "@/lib/page-transition";
import { spring } from "@/lib/motion";
import { PageHeader } from "@/components/PageHeader";
import { ChatInput } from "@/components/toolbar/ChatInput";
import { useChat } from "@/hooks/useChat";

const pageVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%" }),
  center: { y: "0%" },
  exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%" }),
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const direction = getPageTransitionDirection();
  const isHome = pathname === "/";

  const [isCreating, setIsCreating] = useState(false);
  const { append, isLoading, openFullscreen, registerHandlers } = useChat();

  // Register no-op handlers for chat on home routes
  useEffect(() => {
    registerHandlers({
      handleToolCall: () => {},
      getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
      getUserEdits: () => [],
    });
  }, [registerHandlers]);

  // Pre-warm the canvas route
  useEffect(() => {
    router.prefetch("/space/unassigned/canvas/warmup");
  }, [router]);

  const handleSubmit = useCallback(
    (text: string) => {
      openFullscreen(true);
      append({ role: "user", content: text });
    },
    [openFullscreen, append]
  );

  const handleCreateEmptyCanvas = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled" }),
      });

      if (!response.ok) {
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
  }, [isCreating, router]);

  return (
    <div className="relative h-full overflow-hidden bg-gray-50">
      {/* Header — persists across page transitions */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <PageHeader
          actions={
            <div className="flex items-center gap-3">
              {/* Bell icon */}
              <button
                className="flex items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]"
                style={{ width: 32, height: 32, color: "var(--color-gray-800)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.00228 1.33337C5.57825 1.33337 3.54861 3.17018 3.30741 5.58218L2.73229 11.3334H1.33301V12.6667H14.6689V11.3334H13.2723L12.6972 5.58217C12.456 3.17018 10.4263 1.33337 8.00228 1.33337ZM11.3704 5.71485L11.9323 11.3334H4.07227L4.63412 5.71485C4.80716 3.98445 6.26325 2.66671 8.00228 2.66671C9.7413 2.66671 11.1974 3.98445 11.3704 5.71485Z" fill="currentColor"/>
                  <path d="M9.33366 14H6.66699C6.66699 14.7364 7.26395 15.3334 8.00033 15.3334C8.7367 15.3334 9.33366 14.7364 9.33366 14Z" fill="currentColor"/>
                </svg>
              </button>

              {/* Create button */}
              <button
                onClick={handleCreateEmptyCanvas}
                disabled={isCreating}
                className="flex items-center gap-1 text-md font-heading font-medium text-white rounded-full cursor-pointer hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{
                  background: "var(--color-gray-900)",
                  padding: "8px 16px",
                }}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Create
                  </>
                )}
              </button>
            </div>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/miro-logo.svg" alt="Miro" className="w-[56px] h-[20px]" />
        </PageHeader>
      </div>

      {/* Animated page content */}
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={spring.default}
          className="absolute inset-0 bg-gray-50"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>

      {/* Prompt bar — stays in place, fades with route */}
      <AnimatePresence>
        {isHome && (
          <motion.div
            key="prompt-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={spring.default}
            className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4"
          >
            <div style={{ width: 712 }}>
              <div className="mx-auto max-w-3xl px-6">
                <div
                  className="bg-white rounded-full"
                  style={{
                    padding: 6,
                    boxShadow: "0px 6px 16px 0px rgba(34,36,40,0.12), 0px 0px 8px 0px rgba(34,36,40,0.06)",
                  }}
                >
                  <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
