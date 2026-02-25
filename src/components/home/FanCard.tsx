"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { FanCardData } from "./card-data";
import { CardTypeIcon } from "@/components/feed/FeedTypeIcon";

/** Max tilt in degrees */
const TILT_MAX = 10;

const springConfig = { stiffness: 300, damping: 25 };

interface FanCardProps {
  card: FanCardData;
  isHovered: boolean;
}

export function FanCard({ card, isHovered }: FanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

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

  const isGold = card.shiny === "gold";

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
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={cardRef}
      style={{ perspective: 800, width: 200, aspectRatio: "3 / 4" }}
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

        {/* Title — main content area */}
        <div className="flex flex-1 items-center px-4">
          <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-4">
            {card.title}
          </p>
        </div>

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
