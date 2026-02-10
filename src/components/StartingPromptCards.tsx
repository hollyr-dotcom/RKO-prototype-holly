"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLightning,
  IconWarning,
  IconBoard,
  IconMeasurePencil,
  IconChartLine,
  IconLightbulb,
  IconUsers,
  IconTargetArrow,
  IconShuffle,
} from "@mirohq/design-system-icons";

interface Prompt {
  icon: React.ReactNode;
  text: string;
  isTopTip?: boolean;
}

const ALL_PROMPTS: Prompt[] = [
  {
    icon: <IconLightning size="small" />,
    text: "Set up connectors to Gmail, Asana, and more",
    isTopTip: true,
  },
  {
    icon: <IconWarning size="small" />,
    text: "Identify risks and dependencies",
  },
  {
    icon: <IconBoard size="small" />,
    text: "Create a stakeholder alignment workshop",
  },
  {
    icon: <IconMeasurePencil size="small" />,
    text: "Draft key success metrics and signals",
  },
  {
    icon: <IconChartLine size="small" />,
    text: "Map out a product roadmap",
  },
  {
    icon: <IconLightbulb size="small" />,
    text: "Brainstorm feature ideas",
  },
  {
    icon: <IconUsers size="small" />,
    text: "Design a user journey map",
  },
  {
    icon: <IconTargetArrow size="small" />,
    text: "Define project goals and objectives",
  },
  {
    icon: <IconBoard size="small" />,
    text: "Create a competitive analysis",
  },
  {
    icon: <IconChartLine size="small" />,
    text: "Build a feature prioritization matrix",
  },
  {
    icon: <IconUsers size="small" />,
    text: "Design user personas",
  },
  {
    icon: <IconLightning size="small" />,
    text: "Plan a sprint retrospective",
  },
];

interface StartingPromptCardsProps {
  onSelectPrompt: (text: string) => void;
  hideForSuggestions?: boolean;
  isCanvasEmpty?: boolean;
  isChatOpen?: boolean;
  isAIEngaged?: boolean;
  hasToolbarText?: boolean;
  isVoiceActive?: boolean;
}

export function StartingPromptCards({
  onSelectPrompt,
  hideForSuggestions = false,
  isCanvasEmpty = true,
  isChatOpen = false,
  isAIEngaged = false,
  hasToolbarText = false,
  isVoiceActive = false,
}: StartingPromptCardsProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Only enable randomization after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pick 4 random prompts, ensuring the first one is always a "top tip" if available
  const selectedPrompts = useMemo(() => {
    const topTips = ALL_PROMPTS.filter(p => p.isTopTip);
    const others = ALL_PROMPTS.filter(p => !p.isTopTip);

    // On initial server render or before mounted, use deterministic order
    // After mounted or when shuffling, randomize
    const shouldRandomize = isMounted && shuffleKey > 0;
    const shuffledOthers = shouldRandomize
      ? [...others].sort(() => Math.random() - 0.5)
      : others;

    // Take first top tip (if exists) and 3 random others
    const result: Prompt[] = [];
    if (topTips.length > 0) {
      result.push(topTips[0]);
      result.push(...shuffledOthers.slice(0, 3));
    } else {
      result.push(...shuffledOthers.slice(0, 4));
    }

    return result;
  }, [shuffleKey, isMounted]);

  const shouldShow = isCanvasEmpty && !isChatOpen && !isDismissed && !hideForSuggestions && !isAIEngaged && !hasToolbarText && !isVoiceActive;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="starting-prompts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.25 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-start gap-3"
        >
      {/* Cards */}
      <div className="flex gap-2">
        {selectedPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt.text)}
            className="w-44 bg-white pt-3.5 pb-4 pl-5 pr-3.5 border border-gray-200 hover:border-gray-300 transition-all text-left flex items-start"
            style={{
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)';
            }}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <div className="text-gray-700 flex-shrink-0">{prompt.icon}</div>
                {prompt.isTopTip && (
                  <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded-full">
                    Top tip
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-900 leading-snug">
                {prompt.text}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => setIsDismissed(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
          title="Dismiss"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => setShuffleKey(k => k + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
          title="Shuffle prompts"
        >
          <IconShuffle size="small" css={{ color: '#666' }} />
        </button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
