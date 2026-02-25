/**
 * Variant factories for common animation patterns.
 * Each factory returns a Framer Motion variants object with hidden/visible/exit states.
 */

import type { Variants } from "framer-motion";
import type { motionTheme as MotionThemeType } from "./themes";

type Theme = typeof MotionThemeType;

export function fadeIn(theme: Theme): Variants {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: theme.duration.fast } },
    exit: { opacity: 0, transition: { duration: theme.duration.fast } },
  };
}

export function fadeInUp(theme: Theme, distance = 12): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: theme.spring.responsive,
    },
    exit: {
      opacity: 0,
      y: -distance / 2,
      transition: { duration: theme.duration.fast, ease: theme.easing.exit },
    },
  };
}

export function fadeInScale(theme: Theme, scale = 0.95): Variants {
  return {
    hidden: { opacity: 0, scale },
    visible: {
      opacity: 1,
      scale: 1,
      transition: theme.spring.responsive,
    },
    exit: {
      opacity: 0,
      scale,
      transition: { duration: theme.duration.fast, ease: theme.easing.exit },
    },
  };
}

export function slideIn(theme: Theme, direction: "left" | "right" | "up" | "down" = "right", distance = 24): Variants {
  const isHorizontal = direction === "left" || direction === "right";
  const sign = direction === "right" || direction === "down" ? 1 : -1;
  const offset = distance * sign;

  if (isHorizontal) {
    return {
      hidden: { opacity: 0, x: offset },
      visible: { opacity: 1, x: 0, transition: theme.spring.responsive },
      exit: { opacity: 0, x: offset * -0.5, transition: { duration: theme.duration.fast, ease: theme.easing.exit } },
    };
  }
  return {
    hidden: { opacity: 0, y: offset },
    visible: { opacity: 1, y: 0, transition: theme.spring.responsive },
    exit: { opacity: 0, y: offset * -0.5, transition: { duration: theme.duration.fast, ease: theme.easing.exit } },
  };
}

export function scalePress(): Variants {
  return {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    press: { scale: 0.97 },
  };
}

export function staggerContainer(theme: Theme): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: theme.stagger,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: theme.stagger / 2,
        staggerDirection: -1,
      },
    },
  };
}

export function staggerItem(theme: Theme): Variants {
  return {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: theme.spring.responsive,
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: theme.duration.fast, ease: theme.easing.exit },
    },
  };
}

export function expandCollapse(theme: Theme): Variants {
  return {
    collapsed: { height: 0, opacity: 0 },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: { duration: theme.duration.normal, ease: theme.easing.default },
    },
  };
}
