/**
 * Motion theme — maps tokens to semantic roles.
 */

import { duration, easing, spring, delay } from "./tokens";

export const motionTheme = {
  duration: {
    fast: duration.fast,
    normal: duration.normal,
    slow: duration.slow,
  },
  easing: {
    default: easing.standard,
    enter: easing.decelerate,
    exit: easing.accelerate,
  },
  spring: {
    default: spring.default,
    responsive: spring.snappy,
  },
  stagger: delay.stagger,
} as const;
