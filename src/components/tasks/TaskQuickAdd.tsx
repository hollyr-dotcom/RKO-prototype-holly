"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconPlus } from "@mirohq/design-system-icons";
import { motionTheme } from "@/lib/motion/themes";
import { fadeInUp } from "@/lib/motion/variants";

interface TaskQuickAddProps {
  onAdd: (title: string) => void;
}

const addVariants = fadeInUp(motionTheme);

export function TaskQuickAdd({ onAdd }: TaskQuickAddProps) {
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setIsActive(false);
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
      inputRef.current?.focus();
    }
  }, [value, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        setValue("");
        setIsActive(false);
        inputRef.current?.blur();
      }
    },
    [handleSubmit]
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={addVariants}
        initial="hidden"
        animate="visible"
        className="mb-4"
      >
        <div
          className={`flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors duration-200 ${
            isActive ? "border-blue-500" : "border-gray-200"
          }`}
        >
          <IconPlus
            css={{
              width: 16,
              height: 16,
              color: isActive ? "#3b82f6" : "var(--color-gray-400)",
              flexShrink: 0,
            }}
          />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
