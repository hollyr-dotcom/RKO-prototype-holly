"use client";

import { useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import type { FanCardData } from "./card-data";
import { CardTypeIcon } from "@/components/feed/FeedTypeIcon";
import "@/components/feed/holo-card.css";

/** Max tilt in degrees */
const TILT_MAX = 10;

const springConfig = { stiffness: 300, damping: 25 };

const GOLD_GRADIENT =
  "linear-gradient(135deg, rgb(255 232 158), rgb(238 193 47), rgb(255 163 70), rgb(212 175 55), rgb(246 211 101))";

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const VIDEO_TRANSITION = `top 220ms ${EASE}, left 220ms ${EASE}, right 220ms ${EASE}, height 220ms ${EASE}, border-radius 220ms ${EASE}, opacity 200ms ease-out`;

// Video positions within the 240×320 card
const VIDEO_DEFAULT = { top: 132, left: 20, right: 20, height: 108, borderRadius: 12, opacity: 1 };
const VIDEO_EXPANDED = { top: 0, left: 0, right: 0, height: 320, borderRadius: 16, opacity: 1 };

const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  ((v - fMin) / (fMax - fMin)) * (tMax - tMin) + tMin;

type VideoState = "idle" | "loading" | "playing";

interface FanCardProps {
  card: FanCardData;
  isHovered: boolean;
}

export function FanCard({ card, isHovered }: FanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiIdRef = useRef(0);
  const [videoState, setVideoState] = useState<VideoState>("idle");
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const isDecision = card.type === "decision";
  const isGold = card.shiny === "gold";

  // Raw mouse-position values (0 → 1 across the card)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Tilt derived from mouse position, sprung for smooth feel — only when hovered
  const rawRotateX = useTransform(mouseY, [0, 1], isHovered ? [TILT_MAX, -TILT_MAX] : [0, 0]);
  const rawRotateY = useTransform(mouseX, [0, 1], isHovered ? [-TILT_MAX, TILT_MAX] : [0, 0]);
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  // Shimmer gradient position (percentage for background-position)
  const holoX = useTransform(mouseX, [0, 1], [0, 100]);
  const holoY = useTransform(mouseY, [0, 1], [0, 100]);

  // Primary radial — rainbow for holographic, warm gold for gold
  const shinyBackground = useTransform(
    [holoX, holoY],
    ([x, y]: number[]) =>
      isGold
        ? `radial-gradient(circle at ${x}% ${y}%,
            rgba(255,215,0,0.6) 0%,
            rgba(255,185,15,0.55) 15%,
            rgba(218,165,32,0.5) 30%,
            rgba(255,223,100,0.45) 50%,
            rgba(184,134,11,0.4) 70%,
            rgba(255,200,60,0.25) 85%,
            transparent 100%)`
        : `radial-gradient(circle at ${x}% ${y}%,
            rgba(255,60,60,0.55) 0%,
            rgba(255,180,40,0.5) 12%,
            rgba(80,255,80,0.5) 25%,
            rgba(40,200,255,0.55) 38%,
            rgba(140,80,255,0.5) 52%,
            rgba(255,60,200,0.45) 68%,
            rgba(255,100,80,0.3) 85%,
            transparent 100%)`
  );

  // Secondary sweep — gold conic or rainbow conic
  const shinySweep = useTransform(
    [holoX, holoY],
    ([x, y]: number[]) =>
      isGold
        ? `conic-gradient(from ${(x * 3.6)}deg at ${x}% ${y}%,
            rgba(255,215,0,0.3), rgba(218,165,32,0.25), rgba(255,223,100,0.3),
            rgba(184,134,11,0.25), rgba(255,200,60,0.3), rgba(255,185,15,0.25),
            rgba(255,215,0,0.3))`
        : `conic-gradient(from ${(x * 3.6)}deg at ${x}% ${y}%,
            rgba(255,0,0,0.2), rgba(255,165,0,0.2), rgba(255,255,0,0.2),
            rgba(0,255,0,0.2), rgba(0,127,255,0.2), rgba(139,0,255,0.2),
            rgba(255,0,0,0.2))`
  );

  // Specular highlight — warmer for gold
  const specularBackground = useTransform(
    [holoX, holoY],
    ([x, y]: number[]) =>
      isGold
        ? `radial-gradient(ellipse 50% 50% at ${x}% ${y}%, rgba(255,248,220,0.9) 0%, rgba(255,255,255,0) 65%)`
        : `radial-gradient(ellipse 50% 50% at ${x}% ${y}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 65%)`
  );

  // Lighting gradient overlay — simulates directional light based on tilt
  const lightingGradient = useTransform(
    [holoX, holoY],
    ([x, y]: number[]) =>
      `linear-gradient(${180 + (x - 50) * 2}deg, rgba(255,255,255,${0.12 + (1 - y / 100) * 0.15}) 0%, transparent 50%, rgba(0,0,0,${0.04 + (y / 100) * 0.1}) 100%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      mouseX.set(nx);
      mouseY.set(ny);

      // Update CSS custom properties for holo effect
      if (isDecision && cardRef.current) {
        const px = nx * 100;
        const py = ny * 100;
        cardRef.current.style.setProperty("--pointer-x", `${px}%`);
        cardRef.current.style.setProperty("--pointer-y", `${py}%`);
        cardRef.current.style.setProperty("--background-x", `${adjust(px, 0, 100, 37, 63)}%`);
        cardRef.current.style.setProperty("--background-y", `${adjust(py, 0, 100, 33, 67)}%`);
        const fromCenter = Math.min(
          Math.sqrt((py - 50) ** 2 + (px - 50) ** 2) / 50,
          1
        );
        cardRef.current.style.setProperty("--pointer-from-center", String(fromCenter));
        cardRef.current.style.setProperty("--pointer-from-top", String(py / 100));
        cardRef.current.style.setProperty("--pointer-from-left", String(px / 100));
      }
    },
    [mouseX, mouseY, isDecision]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);

    // Reset holo CSS custom properties
    if (isDecision && cardRef.current) {
      cardRef.current.style.setProperty("--pointer-x", "50%");
      cardRef.current.style.setProperty("--pointer-y", "50%");
      cardRef.current.style.setProperty("--background-x", "50%");
      cardRef.current.style.setProperty("--background-y", "50%");
      cardRef.current.style.setProperty("--pointer-from-center", "0");
      cardRef.current.style.setProperty("--pointer-from-top", "0.5");
      cardRef.current.style.setProperty("--pointer-from-left", "0.5");
    }

    // Stop video
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVideoState("idle");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [mouseX, mouseY, isDecision]);

  // Start video on hover for decision cards
  const handleMouseEnter = useCallback(() => {
    if (!isDecision) return;
    setVideoState("loading");
    timerRef.current = setTimeout(() => {
      setVideoState("playing");
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 1000);
  }, [isDecision]);

  const videoPos = videoState === "playing" ? VIDEO_EXPANDED : VIDEO_DEFAULT;

  // Decision cards get the full gold treatment
  if (isDecision) {
    return (
      <div
        data-fan-card
        style={{ perspective: 800, width: 240, aspectRatio: "3 / 4", position: "relative" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <motion.div
          className="relative rounded-2xl [transition:box-shadow_300ms_ease-out]"
          style={{
            boxShadow: isHovered
              ? "0 8px 28px rgba(212,175,55,0.45)"
              : "0 4px 12px rgba(212,175,55,0.2)",
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Gold gradient border */}
          <div
            className={`absolute -inset-[1px] rounded-[17px] pointer-events-none transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-70"}`}
            style={{ background: GOLD_GRADIENT }}
          />

          {/* Card body */}
          <div
            ref={cardRef}
            className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col border border-transparent holo-card${isHovered ? " holo-active" : ""}`}
            style={{ width: 240, aspectRatio: "3 / 4" }}
          >
            {/* Gold gradient face */}
            <div
              className="w-full h-full flex flex-col"
              style={{ background: GOLD_GRADIENT }}
            >
              {/* Header: approved icon */}
              <div className="px-4 pt-4 relative z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/approved.svg"
                  alt="Decision"
                  className="w-7 h-7 flex-shrink-0"
                  style={{
                    filter: videoState === "playing" ? "brightness(0) invert(1)" : "none",
                    transition: "filter 300ms ease-out",
                  }}
                />
              </div>

              {/* Title */}
              <div
                className="px-4 pt-3 relative z-10"
                style={{
                  transition: "opacity 250ms ease-out",
                  opacity: videoState === "playing" ? 0 : 1,
                }}
              >
                <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-4">
                  {card.title}
                </p>
              </div>

              <div className="flex-1" />

              {/* Footer: space name or emoji reactions */}
              <div className="relative px-4 pb-4 h-10 z-10">
                {videoState === "playing" ? (
                  <div className="flex items-center rounded-full px-1 bg-white/90" style={{ height: 28 }}>
                    {["❤️", "👍", "🔥", "👏", "🙌", "👀"].map((emoji) => (
                      <button
                        key={emoji}
                        className="flex-1 flex items-center justify-center text-xs hover:scale-110 transition-transform pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = ++emojiIdRef.current;
                          const btnRect = e.currentTarget.getBoundingClientRect();
                          const outerEl = cardRef.current?.closest("[data-fan-card]") as HTMLElement | null;
                          const cardRect = outerEl?.getBoundingClientRect();
                          const x = cardRect ? btnRect.left - cardRect.left + btnRect.width / 2 : 100;
                          setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
                          setTimeout(() => {
                            setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
                          }, 900);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500/80 truncate">
                    {card.spaceName}
                  </p>
                )}
              </div>
            </div>

            {/* Holo shine + glare overlays */}
            <div className="holo-shine" />
            <div className="holo-glare" />

            {/* Video overlay */}
            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{
                top: videoPos.top,
                left: videoPos.left,
                right: videoPos.right,
                height: videoPos.height,
                borderRadius: videoPos.borderRadius,
                opacity: videoPos.opacity,
                zIndex: 5,
                transition: VIDEO_TRANSITION,
              }}
            >
              <video
                ref={videoRef}
                src="/videos/decisions.mp4"
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                preload="metadata"
              />
              {/* Play button → spinner → hidden */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: videoState === "playing" ? 0 : 1, transition: "opacity 200ms ease-out" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
                >
                  {/* Play icon */}
                  <div className="absolute" style={{ opacity: videoState === "idle" ? 1 : 0, transition: "opacity 200ms ease-out" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M5.5 3.5L12.5 8L5.5 12.5V3.5Z" fill="white" />
                    </svg>
                  </div>
                  {/* Spinner */}
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    style={{ opacity: videoState === "loading" ? 1 : 0, transition: "opacity 200ms ease-out" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating emoji bubbles — outside overflow-hidden card */}
        <AnimatePresence>
          {floatingEmojis.map(({ id, emoji, x }) => (
            <motion.span
              key={id}
              className="absolute pointer-events-none text-2xl select-none"
              style={{ left: x, bottom: 40, translateX: "-50%", zIndex: 20 }}
              initial={{ opacity: 1, y: 0, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0],
                y: -100,
                scale: [0.4, 1.3, 1],
                rotate: [0, -12, 10, -6, 0],
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Default card (non-decision)
  return (
    <div
      ref={cardRef}
      style={{ perspective: 800, width: 240, aspectRatio: "3 / 4" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Header: type icon or avatar */}
        <div className="flex items-center gap-2 px-4 pt-4">
          {!card.isAgent && card.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatar}
              alt={card.sourceName || ""}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ marginLeft: -2 }}>
              <CardTypeIcon itemType={card.type} itemId={card.id} />
            </div>
          )}
        </div>

        {/* Title — top-aligned */}
        <div className="px-4 pt-3">
          <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-4">
            {card.title}
          </p>
        </div>

        <div className="flex-1" />

        {/* Footer: space name */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 truncate">
            {card.spaceName}
          </p>
        </div>

        {/* Lighting/shadow gradient overlay — only on actively hovered card */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background: lightingGradient }}
          />
        )}

        {/* Shiny overlays — holographic (rainbow) or gold, only when hovered */}
        {card.shiny && isHovered && (
          <>
            {/* Primary radial */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-color-dodge"
              style={{ background: shinyBackground }}
            />
            {/* Conic sweep for iridescence / shimmer */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-overlay opacity-60"
              style={{ background: shinySweep }}
            />
            {/* Specular highlight */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ background: specularBackground }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
