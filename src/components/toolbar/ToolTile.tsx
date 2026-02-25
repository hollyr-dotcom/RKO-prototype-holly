"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OverflowItem } from "./toolbar-data";
import { delay } from "@/lib/motion";

interface ToolTileProps {
  tool: OverflowItem;
  onSelect: (tool: OverflowItem) => void;
}

export function ToolTile({ tool, onSelect }: ToolTileProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = tool.icon;

  const handleMouseEnter = useCallback(() => {
    tooltipTimer.current = setTimeout(() => {
      setShowTooltip(true);
    }, delay.tooltip * 1000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setShowTooltip(false);
  }, []);

  return (
    <div className="relative">
      <motion.button
        onClick={() => onSelect(tool)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col items-center justify-center gap-1 rounded-lg w-[72px] h-[64px] cursor-pointer transition-colors duration-200 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        tabIndex={0}
        aria-label={tool.description}
      >
        <span className="flex items-center justify-center w-6 h-6">
          <Icon />
        </span>
        <span className="text-xs font-medium text-gray-900 leading-tight text-center truncate w-full px-1">
          {tool.label}
        </span>
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
          role="tooltip"
        >
          {tool.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
