"use client";

import { motion } from "framer-motion";
import type { ToolItem } from "./toolbar-data";
import { CELL_W, CELL_H, ICON_SIZE } from "./toolbar-constants";

interface ToolbarItemProps {
  tool: ToolItem;
  isActive: boolean;
  onClick: () => void;
}

export function ToolbarItem({ tool, isActive, onClick }: ToolbarItemProps) {
  const Icon = tool.icon;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex items-center justify-center rounded-[24px] transition-colors focus-visible:outline-none ${
        isActive
          ? "text-blue-500"
          : "text-gray-900 hover:text-gray-900/80"
      }`}
      style={{ width: CELL_W, height: CELL_H }}
    >
      <span className="flex items-center justify-center" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
        <Icon />
      </span>
    </motion.button>
  );
}
