/**
 * Motion tokens — durations, easings, springs, and delays.
 * Import from `@/lib/motion` (barrel export).
 */

export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  glacial: 0.8,
} as const;

export const easing = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  decelerate: [0, 0, 0, 1] as [number, number, number, number],
  accelerate: [0.3, 0, 1, 1] as [number, number, number, number],
  sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
  emphasized: [0.2, 0, 0, 1] as [number, number, number, number],
  ios: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  linear: [0, 0, 1, 1] as [number, number, number, number],
};

export const spring = {
  gentle: { type: "spring" as const, stiffness: 120, damping: 20, mass: 1 },
  default: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 30, mass: 1 },
  stiff: { type: "spring" as const, stiffness: 600, damping: 35, mass: 1 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15, mass: 1 },
  soft: { type: "spring" as const, stiffness: 80, damping: 18, mass: 1.2 },
} as const;

export const delay = {
  stagger: 0.04,
  sequence: 0.12,
  cascade: 0.08,
  tooltip: 0.4,
  none: 0,
} as const;
