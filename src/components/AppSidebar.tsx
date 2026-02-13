"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { PrimaryRail } from "@/components/PrimaryRail";
import { SecondaryPanel } from "@/components/SecondaryPanel";
import { ExpandedPrimaryPanel } from "@/components/ExpandedPrimaryPanel";

// Fade variant for the adjacent panel (secondary or expanded overlay)
const panelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: [0.3, 0, 1, 1] as [number, number, number, number] },
  },
};

// Collapse/expand transition for the sidebar container width
const collapseTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export function AppSidebar() {
  const { isCollapsed, showSecondary, navWidth } = useSidebar();

  // Track whether this is the initial mount — skip entrance animation to prevent
  // the PrimaryRail flashing before the ExpandedPrimaryPanel overlay fades in.
  // We use a ref updated via useEffect (not during render) to avoid hydration
  // mismatches — mutating a ref during render causes Framer Motion's server-rendered
  // inline styles to diverge from the client's hydrated styles.
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // After the first render + hydration, mark as animated so subsequent
    // panel switches get the entrance animation.
    hasAnimatedRef.current = true;
  }, []);

  // On initial mount (including SSR), skip the entrance animation.
  // `initial={false}` is Framer Motion's SSR-safe way to say "start in the
  // animate state without playing the initial→animate transition".
  const skipInitialAnimation = !hasAnimatedRef.current;

  // Target width: 0 when collapsed, navWidth when expanded
  const targetWidth = isCollapsed ? 0 : navWidth;

  return (
    <motion.div
      className="h-full flex flex-shrink-0 overflow-hidden relative"
      initial={false}
      animate={{ width: targetWidth }}
      transition={collapseTransition}
    >
      {/* Primary rail — always mounted, never re-renders on level change */}
      <PrimaryRail />

      {/* Adjacent panel: expanded overlay (covers rail) or secondary panel */}
      <AnimatePresence mode="wait">
        {showSecondary ? (
          <motion.div
            key="secondary-panel"
            variants={panelVariants}
            initial={skipInitialAnimation ? false : "hidden"}
            animate="visible"
            exit="exit"
            className="h-full"
          >
            <SecondaryPanel />
          </motion.div>
        ) : (
          <motion.div
            key="expanded-overlay"
            variants={panelVariants}
            initial={skipInitialAnimation ? false : "hidden"}
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-10 h-full"
          >
            <ExpandedPrimaryPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
