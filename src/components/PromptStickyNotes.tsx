"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

/* ── Data ─────────────────────────────────────────────── */

interface StickyNoteData {
  id: string;
  text: string;
  color: { bg: string; text: string; shadow: string };
}

const noteColors = {
  yellow:   { bg: "#F5D550", text: "#5D4E00", shadow: "rgba(200,180,0,0.18)" },
  coral:    { bg: "#F08080", text: "#5C1A1A", shadow: "rgba(200,60,60,0.16)" },
  pink:     { bg: "#E07BE0", text: "#5C1060", shadow: "rgba(180,60,180,0.16)" },
  lavender: { bg: "#B0A0D8", text: "#2E1A5E", shadow: "rgba(100,60,180,0.16)" },
  blue:     { bg: "#88A8E0", text: "#1A2E5C", shadow: "rgba(40,80,200,0.16)" },
};

const notes: StickyNoteData[] = [
  { id: "n1", text: "Prep me for quarterly review",       color: noteColors.yellow },
  { id: "n2", text: "Compare roadmap to insights",        color: noteColors.coral },
  { id: "n3", text: "Surprise me",                        color: noteColors.pink },
  { id: "n4", text: "Summarise last week's updates",      color: noteColors.lavender },
  { id: "n5", text: "Find open blockers across projects", color: noteColors.blue },
];

/* ── Springs (from motion-system guidelines) ──────────── */

const springDefault = { type: "spring" as const, stiffness: 200, damping: 24, mass: 1 };
const springSnappy  = { type: "spring" as const, stiffness: 400, damping: 30, mass: 1 };
const STAGGER       = 0.04; // delay.stagger

/* ── Helpers ──────────────────────────────────────────── */

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateLayout(count: number) {
  const SLOT = 140;
  const total = (count - 1) * SLOT;
  const startX = -total / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * SLOT + rand(-15, 15),
    y: rand(-15.4, 15.4),
    rotate: rand(-6, 6),
  }));
}

/** Random scatter-away targets — each note flies upward with random x spread */
function generateScatterTargets(count: number) {
  return Array.from({ length: count }, () => ({
    x: rand(-300, 300),
    y: rand(-400, -200),
    rotate: rand(-25, 25),
  }));
}

function randomStaggerDelays(count: number) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((pos) => pos * STAGGER);
}

/* ── Component ────────────────────────────────────────── */

interface PromptStickyNotesProps {
  onSelect: (text: string) => void;
  visible?: boolean;
}

export function PromptStickyNotes({ onSelect, visible = true }: PromptStickyNotesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const count = notes.length;

  const layout = useMemo(() => generateLayout(count), [count]);
  const scatterTargets = useMemo(() => generateScatterTargets(count), [count]);
  const staggerDelays = useMemo(() => randomStaggerDelays(count), [count]);

  useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 700, height: 200 }}>
      {notes.map((note, index) => {
        const pos = layout[index];
        const scatter = scatterTargets[index];
        const isHovered = hoveredIndex === index;
        const entryDelay = staggerDelays[index];

        const target = visible
          ? {
              rotate: isHovered ? 0 : pos.rotate,
              x: pos.x,
              y: isHovered ? pos.y - 16 : pos.y,
              scale: isHovered ? 1.08 : 1,
              opacity: 1,
            }
          : {
              rotate: scatter.rotate,
              x: scatter.x,
              y: scatter.y,
              scale: 0.6,
              opacity: 0,
            };

        return (
          <motion.button
            key={note.id}
            className="absolute cursor-pointer"
            style={{ zIndex: isHovered ? 20 : index + 1 }}
            initial={{ rotate: 0, x: 0, y: 0, scale: 0.8, opacity: 0 }}
            animate={target}
            transition={
              entered
                ? { ...springSnappy, delay: entryDelay, opacity: { duration: 0.2, delay: entryDelay } }
                : { ...springDefault, delay: entryDelay, opacity: { duration: 0.25, delay: entryDelay } }
            }
            onHoverStart={() => visible && setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            onClick={() => visible && onSelect(note.text)}
          >
            <div
              className="flex flex-col p-4 text-left"
              style={{
                width: 160,
                height: 160,
                backgroundColor: note.color.bg,
                borderRadius: 4,
                boxShadow: isHovered
                  ? `0 8px 24px ${note.color.shadow}, 0 2px 8px rgba(0,0,0,0.08)`
                  : `0 2px 8px ${note.color.shadow}, 0 1px 3px rgba(0,0,0,0.06)`,
              }}
            >
              {/* Corner fold */}
              <div
                className="pointer-events-none absolute right-0 top-0"
                style={{
                  width: 20,
                  height: 20,
                  background: "linear-gradient(225deg, rgba(0,0,0,0.06) 0%, transparent 60%)",
                  borderRadius: "0 4px 0 0",
                }}
              />
              <p className="text-sm font-medium leading-snug" style={{ color: note.color.text }}>
                {note.text}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
