"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { spring, delay } from "@/lib/motion";
import type { FanCardData } from "./card-data";
import { FanCard } from "./FanCard";

/**
 * Fan layout configuration for up to 4 cards.
 */
const fanLayouts: Record<number, { rotate: number; x: number; y: number }[]> = {
  3: [
    { rotate: -5, x: -120, y: 4 },
    { rotate: 0, x: 0, y: 0 },
    { rotate: 5, x: 120, y: 4 },
  ],
  4: [
    { rotate: -7, x: -170, y: 8 },
    { rotate: -2.5, x: -56, y: 1 },
    { rotate: 2.5, x: 56, y: 1 },
    { rotate: 7, x: 170, y: 8 },
  ],
};

const PUSH_AMOUNT = 24;
const PUSH_ROTATION = 0.5;

function centerOutDelay(index: number, count: number): number {
  const center = (count - 1) / 2;
  const distFromCenter = Math.abs(index - center);
  return distFromCenter * delay.cascade;
}

function getPushOffset(
  cardIndex: number,
  hoveredIndex: number | null
): { x: number; rotate: number } {
  if (hoveredIndex === null || cardIndex === hoveredIndex) {
    return { x: 0, rotate: 0 };
  }
  const direction = Math.sign(cardIndex - hoveredIndex);
  return { x: direction * PUSH_AMOUNT, rotate: direction * PUSH_ROTATION };
}

interface CardFanProps {
  cards: FanCardData[];
  onSelect?: (card: FanCardData) => void;
}

export function CardFan({ cards, onSelect }: CardFanProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const count = cards.length;

  return (
    <div className="relative flex items-center justify-center" style={{ height: 360 }}>
      {cards.map((card, index) => {
        const layout = (fanLayouts[count] ?? fanLayouts[3])[index];
        const isHovered = hoveredIndex === index;
        const baseZ = index + 1;
        const staggerDelay = centerOutDelay(index, count);
        const push = getPushOffset(index, hoveredIndex);

        return (
          <motion.div
            key={card.id}
            className="absolute cursor-pointer"
            style={{
              transformOrigin: "center bottom",
              zIndex: isHovered ? 10 : baseZ,
            }}
            initial={{
              rotate: 0,
              x: 0,
              y: 40,
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              rotate: layout.rotate + push.rotate,
              x: layout.x + push.x,
              y: isHovered ? layout.y - 24 : layout.y,
              opacity: 1,
              scale: isHovered ? 1.06 : 1,
            }}
            transition={{
              ...spring.bouncy,
              delay: staggerDelay,
              opacity: { duration: 0.2, delay: staggerDelay },
              x: { ...spring.snappy, delay: 0 },
              y: { ...spring.snappy, delay: 0 },
              rotate: { ...spring.snappy, delay: 0 },
              scale: { ...spring.snappy, delay: 0 },
            }}
            onClick={() => onSelect?.(card)}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            <FanCard card={card} isHovered={isHovered} />
          </motion.div>
        );
      })}
    </div>
  );
}
