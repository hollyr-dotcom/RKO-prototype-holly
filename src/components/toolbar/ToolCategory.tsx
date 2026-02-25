"use client";

import { motion } from "framer-motion";
import type { ToolCategory as ToolCategoryType, OverflowItem } from "./toolbar-data";
import { ToolTile } from "./ToolTile";
import { spring, delay as motionDelay } from "@/lib/motion";

const categoryVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionDelay.stagger,
    },
  },
};

const tileVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.snappy,
  },
};

interface ToolCategoryProps {
  category: ToolCategoryType;
  onSelect: (tool: OverflowItem) => void;
}

export function ToolCategory({ category, onSelect }: ToolCategoryProps) {
  return (
    <motion.div variants={categoryVariants} initial="hidden" animate="visible">
      <div className="px-3 pt-3 pb-1">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {category.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 px-1">
        {category.tools.map((tool) => (
          <motion.div key={tool.id} variants={tileVariants}>
            <ToolTile tool={tool} onSelect={onSelect} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
