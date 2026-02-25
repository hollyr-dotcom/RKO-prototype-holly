"use client";

import { motion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";

interface WorkspaceSidebarProps {
  spaces: { id: string; name: string }[];
  activeSpaceId: string | null;
  taskCountBySpace: Record<string, number>;
  totalCount: number;
  onSpaceSelect: (spaceId: string | null) => void;
}

export function WorkspaceSidebar({
  spaces,
  activeSpaceId,
  taskCountBySpace,
  totalCount,
  onSpaceSelect,
}: WorkspaceSidebarProps) {
  return (
    <motion.nav
      className="w-56 flex-shrink-0 pr-6"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring.gentle}
    >
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
        Workspaces
      </h2>
      <ul className="space-y-0.5">
        <li>
          <button
            onClick={() => onSpaceSelect(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-200 ${
              activeSpaceId === null
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>All tasks</span>
            <span className="text-xs text-gray-400">{totalCount}</span>
          </button>
        </li>
        {spaces.map((space) => (
          <li key={space.id}>
            <button
              onClick={() =>
                onSpaceSelect(activeSpaceId === space.id ? null : space.id)
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-200 ${
                activeSpaceId === space.id
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="truncate">{space.name}</span>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                {taskCountBySpace[space.id] ?? 0}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
