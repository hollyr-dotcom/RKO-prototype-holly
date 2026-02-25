"use client";

import { memo } from "react";
import {
  IconEyeOpen,
  IconEyeOpenSlash,
} from "@mirohq/design-system-icons";
import { motion, AnimatePresence } from "framer-motion";
import { duration, easing } from "@/lib/motion";

export interface FollowModeIndicatorProps {
  isEnabled: boolean;
  isPaused: boolean;
  isAIActive: boolean;
  onToggle: () => void;
}

const indicatorTransition = {
  type: "tween" as const,
  ease: easing.standard,
  duration: duration.fast,
};

export const FollowModeIndicator = memo(function FollowModeIndicator({
  isEnabled,
  isPaused,
  isAIActive,
  onToggle,
}: FollowModeIndicatorProps) {
  // Hide when AI is not active
  if (!isAIActive) return null;

  const tooltip = isEnabled
    ? isPaused
      ? "Paused \u2014 click to resume"
      : "Following AI"
    : "Follow AI";

  const isActive = isEnabled && !isPaused;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={indicatorTransition}
      >
        <button
          onClick={onToggle}
          title={tooltip}
          className={`
            p-2 rounded-lg shadow-sm border transition-colors duration-200
            flex items-center justify-center
            ${
              isActive
                ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }
          `}
          style={{ width: 32, height: 32 }}
        >
          {isEnabled && !isPaused ? (
            <IconEyeOpen css={{ width: 16, height: 16 }} />
          ) : (
            <IconEyeOpenSlash css={{ width: 16, height: 16 }} />
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
});
